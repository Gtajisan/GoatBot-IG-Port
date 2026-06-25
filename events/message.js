'use strict';

const config          = require('../config');
const logger          = require('../utils/logger');
const PermissionManager = require('../utils/permissions');
const Banner          = require('../utils/banner');
const database        = require('../utils/database');
const moderation      = require('../utils/moderation');
const ConfigManager   = require('../utils/configManager');
const { buildGoatV2Params } = require('../utils/goatcompat');

module.exports = {
  config: {
    name: 'message',
    description: 'Handle incoming messages and dispatch commands'
  },

  async run(bot, data) {
    try {
      const { api, commandLoader } = bot;
      const event = data;

      if (event.senderID === bot.userID) return;
      if (config.ANTI_INBOX && !event.isGroup) return;

      Banner.messageReceived(event.senderID, event.body || '');

      // Track user
      const user = database.getUser(event.senderID);
      user.messageCount = (user.messageCount || 0) + 1;
      database.updateUser(event.senderID, user);

      // Moderation gate
      const modResult = await moderation.moderateMessage(event.senderID, event.threadId, event.body);
      if (!modResult.allowed) {
        if (modResult.message) await api.sendMessage(modResult.message, event.threadId);
        return;
      }

      if (!event.body || typeof event.body !== 'string') return;

      // Auto-responses
      const autoResponse = database.findAutoResponse(event.body);
      if (autoResponse) { await api.sendMessage(autoResponse.response, event.threadId); return; }

      // Determine prefix
      const threadData = database.getThreadData(event.threadId);
      const prefix = threadData?.prefix || config.PREFIX;

      // Prefix info shortcut
      const bodyLower = event.body.toLowerCase().trim();
      if (bodyLower === 'prefix') {
        await api.sendMessage(`🌐 Bot prefix: ${prefix}`, event.threadId);
        return;
      }

      const startsWithPrefix = event.body.startsWith(prefix);
      const noPrefixAllowed  = config.NO_PREFIX && PermissionManager.canUseNoPrefix(event.senderID);
      if (!startsWithPrefix && !noPrefixAllowed) return;

      // Parse command + args
      let rawBody = event.body;
      if (startsWithPrefix) rawBody = event.body.slice(prefix.length);
      const args = rawBody.trim().split(/ +/);
      const commandName = args.shift().toLowerCase();
      if (!commandName) return;

      const command = commandLoader.getCommand(commandName);

      // Command not found
      if (!command) {
        if (startsWithPrefix && !config.HIDE_NOTI.commandNotFound) {
          const allNames = commandLoader.getAllCommandNames();
          const closest  = this.findClosestCommand(commandName, allNames);
          let msg = `❌ Unknown command: "${commandName}"\n\n`;
          if (closest && closest.distance <= 3) msg += `💡 Did you mean: ${prefix}${closest.command}?\n\n`;
          msg += `Type ${prefix}help to see all available commands.`;
          await api.sendMessage(msg, event.threadId);
        }
        return;
      }

      // Admin-only mode
      if (config.ADMIN_ONLY_ENABLE) {
        const ignored = config.ADMIN_ONLY_IGNORE_COMMANDS.map(n => n.toLowerCase());
        if (!ignored.includes(commandName)) {
          const userRole = PermissionManager.getUserRole(event.senderID);
          if (userRole < 2) {
            if (!config.HIDE_NOTI.adminOnly) await api.sendMessage('🔒 Bot is in admin-only mode.', event.threadId);
            return;
          }
        }
      }

      // Cooldown
      const cooldownTime = (command.config.cooldown || command.config.countDown || 0) * 1000;
      const remaining    = commandLoader.checkCooldown(event.senderID, command.config.name, cooldownTime);
      if (remaining > 0) {
        await api.sendMessage(`⏰ Please wait ${remaining}s before using this command again.`, event.threadId);
        return;
      }

      // Spam
      const spamCheck = moderation.checkCommandSpam(event.senderID);
      if (spamCheck.isSpam) {
        const banHours = config.SPAM_BAN_DURATION;
        database.banUser(String(event.senderID), banHours * 3600 * 1000);
        moderation.resetSpam(event.senderID);
        if (spamCheck.message) await api.sendMessage(spamCheck.message, event.threadId);
        return;
      }

      // Permission
      const requiredRole = command.config.role || 0;
      let threadInfo = null;
      if (requiredRole === 1) {
        threadInfo = await bot.getThreadInfo(event.threadId).catch(() => null);
      }
      const hasPermission = await PermissionManager.hasPermission(event.senderID, requiredRole, threadInfo);
      if (!hasPermission) {
        if (!config.HIDE_NOTI.needRoleToUseCmd) {
          const roleName = PermissionManager.getRoleName(requiredRole);
          await api.sendMessage(`❌ Access Denied!\n\nThis command requires: ${roleName}`, event.threadId);
        }
        return;
      }

      // Execute
      try {
        Banner.commandExecuted(command.config.name, event.senderID, true);
        user.commandCount = (user.commandCount || 0) + 1;
        database.updateUser(event.senderID, user);
        database.incrementStat('totalCommands');

        const normalizedEvent = {
          ...event,
          threadID: event.threadId || event.threadID,
          senderID: event.senderId || event.senderID
        };

        if (command._isGoatV2 || command.onStart) {
          // GoatBot V2 format — build compat params
          const params = buildGoatV2Params({
            bot,
            event: normalizedEvent,
            args,
            commandName: command.config.name,
            command
          });
          const fn = command.onStart || command.run;
          await fn(params);
        } else {
          // Native InstaBOT format
          const replyApi = new Proxy(api, {
            get(target, prop) {
              if (prop === 'sendMessage') {
                return async (text, threadID) => {
                  try {
                    return await target.replyToMessage(threadID, text, event.messageID);
                  } catch (_) {
                    return await target.sendMessage(text, threadID);
                  }
                };
              }
              return target[prop];
            }
          });

          await command.run({
            api: replyApi,
            event: normalizedEvent,
            args,
            bot,
            commandName: command.config.name,
            logger,
            database,
            config,
            PermissionManager,
            ConfigManager
          });
        }

        if (cooldownTime > 0) {
          commandLoader.setCooldown(event.senderID, command.config.name, cooldownTime);
        }
      } catch (error) {
        logger.error(`Command error: ${command.config.name}`, { error: error.message });
        Banner.commandExecuted(command.config.name, event.senderID, false);
        try {
          await api.sendMessage(`❌ Error: ${error.message}`, event.threadId);
        } catch (_) {}
      }
    } catch (error) {
      logger.error('Error in message event handler', { error: error.message, stack: error.stack });
    }
  },

  findClosestCommand(input, commandList) {
    let closest = null;
    let minDist = Infinity;
    for (const cmd of commandList) {
      const d = this.levenshtein(input.toLowerCase(), cmd.toLowerCase());
      if (d < minDist) { minDist = d; closest = cmd; }
    }
    return closest ? { command: closest, distance: minDist } : null;
  },

  levenshtein(a, b) {
    const m = [], la = a.length, lb = b.length;
    for (let i = 0; i <= la; i++) m[i] = [i];
    for (let j = 0; j <= lb; j++) m[0][j] = j;
    for (let i = 1; i <= la; i++) {
      for (let j = 1; j <= lb; j++) {
        m[i][j] = a[i-1] === b[j-1]
          ? m[i-1][j-1]
          : Math.min(m[i-1][j-1] + 1, m[i][j-1] + 1, m[i-1][j] + 1);
      }
    }
    return m[la][lb];
  }
};
