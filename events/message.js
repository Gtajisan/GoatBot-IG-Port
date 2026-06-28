const config = require('../config');
const logger = require('../utils/logger');
const PermissionManager = require('../utils/permissions');
const Banner = require('../utils/banner');
const database = require('../utils/database');
const moderation = require('../utils/moderation');
const ConfigManager = require('../utils/configManager');

module.exports = {
  config: { name: 'message', description: 'Handle incoming messages' },

  async run(bot, data) {
    try {
      const { api, commandLoader } = bot;
      const event = data;

      if (event.senderID === bot.userID) return;
      if (config.ANTI_INBOX && !event.isGroup) return;

      if (!config.LOG_EVENTS.disableAll && config.LOG_EVENTS.message) {
        Banner.messageReceived(event.senderID, event.body || '');
      }

      const user = database.getUser(event.senderID);
      user.messageCount = (user.messageCount || 0) + 1;
      database.updateUser(event.senderID, user);

      // onFirstChat support
      if (!global.client) global.client = {};
      if (!global.client.onFirstChat) global.client.onFirstChat = new Set();
      if (!global.client.onFirstChat.has(event.threadId)) {
          global.client.onFirstChat.add(event.threadId);
          for (const [name, cmd] of bot.commandLoader.commands) {
              if (typeof cmd.onFirstChat === 'function') {
                  cmd.onFirstChat({
                      api, event, bot, database, usersData: database.usersData, threadsData: database.threadsData
                  }).catch(e => logger.error(`onFirstChat error in ${name}`, { error: e.message }));
              }
          }
      }

      // onChat support
      for (const [name, cmd] of bot.commandLoader.commands) {
          if (typeof cmd.onChat === 'function') {
              cmd.onChat({
                  api,
                  event,
                  bot,
                  database,
                  usersData: database.usersData,
                  threadsData: database.threadsData,
                  getLang: (...args) => require('../utils.js').getText(cmd.config.name, ...args)
              }).catch(e => logger.error(`onChat error in ${name}`, { error: e.message }));
          }
      }

      const modResult = await moderation.moderateMessage(event.senderID, event.threadId, event.body);
      if (!modResult.allowed) {
        if (modResult.message) await api.sendMessage(modResult.message, event.threadId);
        return;
      }

      if (!event.body || typeof event.body !== 'string') return;

      const autoResponse = database.findAutoResponse(event.body);
      if (autoResponse) { await api.sendMessage(autoResponse.response, event.threadId); return; }

      // Handle onReply
      if (event.replyToItemId) {
          const replyData = database.getReplyData(event.replyToItemId) || global.GoatBot.onReply.get(String(event.replyToItemId));
          if (replyData && replyData.commandName) {
              const command = commandLoader.getCommand(replyData.commandName);
              if (command) {
                  const replyParams = {
                      api, event, bot, commandName: replyData.commandName,
                      logger, database, usersData: database.usersData,
                      threadsData: database.threadsData,
                      Reply: replyData, replyData
                  };
                  if (typeof command.onReply === 'function') return await command.onReply(replyParams);
                  if (typeof command.handleReply === 'function') return await command.handleReply(replyParams);
              }
          }
      }

      const threadData = database.getThreadData(event.threadId);
      const prefix = threadData?.prefix || config.PREFIX;

      const bodyLower = event.body.toLowerCase().trim();
      if (bodyLower === 'prefix') {
        await api.sendMessage(`🌐 Global prefix: ${config.PREFIX}\n🛸 Thread prefix: ${prefix}`, event.threadId);
        return;
      }

      const startsWithPrefix = event.body.startsWith(prefix);
      const noPrefixAllowed  = config.NO_PREFIX && PermissionManager.canUseNoPrefix(event.senderID);

      if (!startsWithPrefix && !noPrefixAllowed) return;

      let rawBody = event.body;
      if (startsWithPrefix) rawBody = event.body.slice(prefix.length);
      const args = rawBody.trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      if (!commandName) {
        if (startsWithPrefix) await api.sendMessage(`ℹ️ Type ${prefix}help to see all commands.`, event.threadId);
        return;
      }


      const command = commandLoader.getCommand(commandName);

      if (!command) {
        if (startsWithPrefix && !config.HIDE_NOTI.commandNotFound) {
          // AI Fallback logic
          if (config.AI_FALLBACK?.enable) {
            const aiCommandName = config.AI_FALLBACK.command || 'gpt';
            const aiCommand = commandLoader.getCommand(aiCommandName);
            if (aiCommand) {
              const aiArgs = [commandName, ...args];
              return await aiCommand.run({ api, event, args: aiArgs, bot, commandName: aiCommandName, logger, database, config, PermissionManager, ConfigManager });
            }
          }

          const allNames = commandLoader.getAllCommandNames();
          const closest  = this.findClosestCommand(commandName, allNames);
          let msg = `❌ Unknown command: "${commandName}"\n\n`;
          if (closest && closest.distance <= 3) msg += `💡 Did you mean: ${prefix}${closest.command}?\n\n`;
          msg += `Type ${prefix}help to see all available commands.`;
          await api.sendMessage(msg, event.threadId);
        }
        return;
      }

      if (config.ADMIN_ONLY_ENABLE) {
        const ignored = config.ADMIN_ONLY_IGNORE_COMMANDS.map(n => n.toLowerCase());
        if (!ignored.includes(commandName) && PermissionManager.getUserRole(event.senderID) < 2) {
          if (!config.HIDE_NOTI.adminOnly) await api.sendMessage('🔒 Bot is in admin-only mode.', event.threadId);
          return;
        }
      }

      const cooldownTime = (command.config.cooldown || 0) * 1000;
      const remaining    = commandLoader.checkCooldown(event.senderID, command.config.name, cooldownTime);
      if (remaining > 0) {
        await api.sendMessage(`⏰ Please wait ${remaining}s before using this command again.`, event.threadId);
        return;
      }

      const spamCheck = moderation.checkCommandSpam(event.senderID);
      if (spamCheck.isSpam) {
        database.banUser(String(event.senderID));
        moderation.resetSpam(event.senderID);
        if (spamCheck.message) await api.sendMessage(spamCheck.message, event.threadId);
        return;
      }

      const requiredRole = command.config.role || 0;
      let threadInfo = null;
      if (requiredRole === 1) threadInfo = await bot.getThreadInfo(event.threadId).catch(() => null);
      const hasPermission = await PermissionManager.hasPermission(event.senderID, requiredRole, threadInfo);
      if (!hasPermission) {
        if (!config.HIDE_NOTI.needRoleToUseCmd) {
          await api.sendMessage(`❌ Access Denied!\n\nRequires: ${PermissionManager.getRoleName(requiredRole)}`, event.threadId);
        }
        return;
      }

      try {
        Banner.commandExecuted(command.config.name, event.senderID, true);
        user.commandCount = (user.commandCount || 0) + 1;
        database.updateUser(event.senderID, user);
        database.incrementStat('totalCommands');

        const replyApi = new Proxy(api, {
          get(target, prop) {
            if (prop === 'sendMessage') {
              return async (text, threadID) => {
                try { return await target.replyToMessage(threadID, text, event.messageID); }
                catch (_) { return await target.sendMessage(text, threadID); }
              };
            }
            return target[prop];
          }
        });

        const getLang = (...args) => require('../utils.js').getText(command.config.name, ...args);
        const commandParams = {
            api: replyApi,
            event,
            args,
            bot,
            commandName: command.config.name,
            logger,
            database,
            usersData: database.usersData,
            threadsData: database.threadsData,
            config,
            getLang,
            PermissionManager,
            ConfigManager,
            message: {
                reply: (form, callback) => replyApi.sendMessage(form, event.threadId, callback, event.messageID),
                send: (form, callback) => replyApi.sendMessage(form, event.threadId, callback),
                reaction: (emoji, messageID, callback) => replyApi.setMessageReaction(emoji, messageID || event.messageID, callback),
                unsend: (messageID, callback) => replyApi.unsendMessage(messageID || event.messageID, callback),
                err: (err) => {
                    const msg = typeof err === 'object' ? err.message || JSON.stringify(err) : String(err);
                    return replyApi.sendMessage(`❌ Error: ${msg}`, event.threadId);
                },
                SyntaxError: () => {
                    return replyApi.sendMessage(`❌ Syntax Error!\nUse: ${prefix}help ${command.config.name} for usage instructions.`, event.threadId);
                }
            }
        };

        if (typeof command.onStart === 'function') {
            await command.onStart(commandParams);
        } else if (typeof command.run === 'function') {
            await command.run(commandParams);
        }
        if (cooldownTime > 0) commandLoader.setCooldown(event.senderID, command.config.name, cooldownTime);
      } catch (e) {
        logger.error(`Command error: ${command.config.name}`, { error: e.message });
        Banner.commandExecuted(command.config.name, event.senderID, false);
        await api.sendMessage(`❌ Error: ${e.message}`, event.threadId);
      }
    } catch (e) {
      logger.error('Error in message event handler', { error: e.message, stack: e.stack });
    }
  },

  findClosestCommand(input, list) {
    let best = null, minD = Infinity;
    for (const c of list) {
      const d = this.levenshtein(input.toLowerCase(), c.toLowerCase());
      if (d < minD) { minD = d; best = c; }
    }
    return best ? { command: best, distance: minD } : null;
  },

  levenshtein(a, b) {
    const m = [], la = a.length, lb = b.length;
    for (let i = 0; i <= la; i++) m[i] = [i];
    for (let j = 0; j <= lb; j++) m[0][j] = j;
    for (let i = 1; i <= la; i++) for (let j = 1; j <= lb; j++)
      m[i][j] = a[i-1] === b[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
    return m[la][lb];
  }
};
