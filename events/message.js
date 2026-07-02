'use strict';

const config = require('../config');
const logger = require('../utils/logger');
const PermissionManager = require('../utils/permissions');
const ConfigManager = require('../utils/configManager');
const moderation = require('../utils/moderation');
const Banner = require('../utils/banner');
const utils = require('../utils.js');

module.exports = {
  config: {
    name: 'message',
    description: 'Main message handler'
  },
  async run({ api, event, bot, database }) {
    logger.debug(`Incoming message from ${event.senderID} in ${event.threadId}: ${event.body}`);
    try {
      const { commandLoader } = bot;

      // 1. Check if user/thread is banned
      if (database.isUserBanned(event.senderID) || database.isThreadBanned(event.threadId)) {
          logger.debug(`Ignoring message from banned user ${event.senderID} or thread ${event.threadId}`);
          return;
      }

      // 2. Handle onReply
      if (event.replyToItemId) {
          const replyData = database.getReplyData(event.replyToItemId) || global.GoatBot.onReply.get(String(event.replyToItemId));
          if (replyData && replyData.commandName) {
              const command = commandLoader.getCommand(replyData.commandName);
              if (command && typeof command.onReply === 'function') {
                  const getLang = (...args) => utils.getText(command.config.name, ...args);

                  // Apply human delay before replying if configured
                  if (config.HUMAN_DELAY?.enable) await utils.humanDelay();

                  return await command.onReply({
                      api, event, bot, commandName: replyData.commandName,
                      logger, database, usersData: database.usersData,
                      threadsData: database.threadsData,
                      Reply: replyData, replyData, getLang
                  });
              }
          }
      }

      const threadData = database.getThreadData(event.threadId);
      const prefix = threadData?.prefix || config.PREFIX;

      // 3. Prefix logic
      const startsWithPrefix = event.body.startsWith(prefix);
      const noPrefixAllowed = config.NO_PREFIX && PermissionManager.canUseNoPrefix(event.senderID);

      if (!startsWithPrefix && !noPrefixAllowed) {
          // Trigger onChat for commands that listen to all messages
          for (const [name, cmd] of commandLoader.commands) {
              if (typeof cmd.onChat === 'function') {
                  cmd.onChat({ api, event, bot, database, usersData: database.usersData, threadsData: database.threadsData });
              }
          }
          return;
      }

      let rawBody = event.body;
      if (startsWithPrefix) rawBody = event.body.slice(prefix.length);
      const args = rawBody.trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      if (!commandName) return;

      let command = commandLoader.getCommand(commandName);

      // Alias check
      if (!command) {
          for (const [name, cmd] of commandLoader.commands) {
              if (cmd.config.aliases && cmd.config.aliases.includes(commandName)) {
                  command = cmd;
                  break;
              }
          }
      }

      if (command) {
          logger.debug(`Executing command: ${command.config.name} for user: ${event.senderID}`);
          await this.executeCommand(command, { api, event, args, bot, commandName: command.config.name, logger, database, config, prefix });
      } else if (config.AI_FALLBACK?.enable) {
          // AI Fallback logic
          const aiCommandName = config.AI_FALLBACK.command || 'gpt';
          const aiCommand = commandLoader.getCommand(aiCommandName);
          if (aiCommand) {
              logger.debug(`Command not found. Routing to AI fallback (${aiCommandName}) for user: ${event.senderID}`);
              // Re-inject command name into args for AI to process
              const aiArgs = [commandName, ...args];
              await this.executeCommand(aiCommand, { api, event, args: aiArgs, bot, commandName: aiCommandName, logger, database, config, prefix });
          }
      }

    } catch (e) {
      logger.error('Error in message handler', { error: e.message, stack: e.stack });
    }
  },

  async executeCommand(command, { api, event, args, bot, commandName, logger, database, config, prefix }) {
      const getLang = (...args) => utils.getText(command.config.name, ...args);

      // Anti-ban: Random human delay
      if (config.HUMAN_DELAY?.enable) {
          await utils.humanDelay();
      }

      // Anti-ban: Typing indicator
      if (config.TYPING_INDICATOR?.enable && api.sendTypingIndicator) {
          api.sendTypingIndicator(event.threadId).catch(() => {});
          const duration = config.TYPING_INDICATOR.duration || 1500;
          await new Promise(resolve => setTimeout(resolve, duration));
      }

      const messageHelper = {
          reply: (form, callback) => api.sendMessage(form, event.threadId, callback, event.messageID),
          send: (form, callback) => api.sendMessage(form, event.threadId, callback),
          reaction: (emoji, id) => api.setMessageReaction(emoji, id || event.messageID),
          unsend: (id) => api.unsendMessage(id || event.messageID),
          err: (err) => api.sendMessage(`❌ Error: ${err.message || err}`, event.threadId),
          SyntaxError: () => api.sendMessage(`❌ Syntax Error!\nUse: ${prefix}help ${commandName}`, event.threadId)
      };

      const params = {
          api, event, args, bot, commandName, logger, database,
          usersData: database.usersData, threadsData: database.threadsData,
          config, getLang, message: messageHelper,
          PermissionManager, ConfigManager
      };

      try {
          if (typeof command.onStart === 'function') {
              await command.onStart(params);
          } else if (typeof command.run === 'function') {
              await command.run(params);
          }
          // Command log for structured analytics
          logger.success('COMMAND', `${commandName} executed by ${event.senderID} in ${event.threadId}`);
      } catch (error) {
          logger.error(`Error executing command ${commandName}`, { error: error.message, stack: error.stack });
          messageHelper.err(error);
      }
  }
};
