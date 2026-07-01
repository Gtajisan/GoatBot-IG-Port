'use strict';

const config = require('../config');
const logger = require('../utils/logger');
const PermissionManager = require('../utils/permissions');
const ConfigManager = require('../utils/configManager');
const moderation = require('../utils/moderation');
const Banner = require('../utils/banner');

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
      if (event.replyToItemId || event.replyToMessageID) {
          const replyToID = String(event.replyToItemId || event.replyToMessageID);
          const replyData = database.getReplyData(replyToID) || global.GoatBot.onReply.get(replyToID);
          if (replyData && replyData.commandName) {
              const command = commandLoader.getCommand(replyData.commandName);
              if (command && typeof command.onReply === 'function') {
                  const getLang = (...args) => global.utils.getText(command.config.name, ...args);

                  // Natural Delay before reply handling
                  if (global.utils && typeof global.utils.humanDelay === 'function') {
                      await global.utils.humanDelay();
                  }

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

      if (!command) {
          // Alias check
          for (const [name, cmd] of commandLoader.commands) {
              if (cmd.config.aliases && cmd.config.aliases.includes(commandName)) {
                  command = cmd;
                  break;
              }
          }
      }

      if (command) {
          logger.debug(`Executing command: ${command.config.name} for user: ${event.senderID}`);
          // Natural Delay before command execution
          if (global.utils && typeof global.utils.humanDelay === 'function') {
              await global.utils.humanDelay();
          }
          await this.executeCommand(command, { api, event, args, bot, commandName: command.config.name, logger, database, config, prefix });
      } else if (config.AI_FALLBACK?.enable) {
          // AI Fallback for unknown commands
          const aiCommand = commandLoader.getCommand(config.AI_FALLBACK.command || 'gpt');
          if (aiCommand) {
              logger.info('AI_FALLBACK', `Unknown command "${commandName}", routing to AI command.`);
              // Put the full body back into args or handle as needed by the AI command
              const aiArgs = (event.body || "").startsWith(prefix) ? event.body.slice(prefix.length).trim().split(/ +/) : (event.body || "").trim().split(/ +/);
              if (global.utils && typeof global.utils.humanDelay === 'function') {
                  await global.utils.humanDelay();
              }
              await this.executeCommand(aiCommand, { api, event, args: aiArgs, bot, commandName: aiCommand.config.name, logger, database, config, prefix });
          }
      }

    } catch (e) {
      logger.error('Error in message handler', { error: e.message, stack: e.stack });
    }
  },

  async executeCommand(command, { api, event, args, bot, commandName, logger, database, config, prefix }) {
      const getLang = (...args) => global.utils.getText(command.config.name, ...args);

      const messageHelper = {
          reply: async (form, callback) => {
              try {
                  return await api.sendMessage(form, event.threadId, callback, event.messageID);
              } catch (e) {
                  logger.error(`Failed to reply to ${event.threadId}`, { error: e.message });
                  throw e;
              }
          },
          send: async (form, callback) => {
              try {
                  return await api.sendMessage(form, event.threadId, callback);
              } catch (e) {
                  logger.error(`Failed to send message to ${event.threadId}`, { error: e.message });
                  throw e;
              }
          },
          reaction: (emoji, id) => api.setMessageReaction(emoji, id || event.messageID),
          unsend: (id) => api.unsendMessage(id || event.messageID),
          err: (err) => {
              const errorMessage = err.message || String(err);
              logger.error(`Command Error (${commandName})`, { error: errorMessage });
              return api.sendMessage(`❌ Error: ${errorMessage}`, event.threadId);
          },
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
          // Log success
          logger.command(commandName, event.senderID, event.threadId, 'SUCCESS');
      } catch (e) {
          logger.command(commandName, event.senderID, event.threadId, 'FAILED');
          logger.error(`Error executing command ${commandName}`, { error: e.message, stack: e.stack });
          messageHelper.err(e);
      }
  }
};
