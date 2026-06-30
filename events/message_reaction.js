'use strict';

module.exports = {
  config: {
    name: 'message_reaction'
  },
  async run({ api, event, bot, logger, database }) {
    try {
      const { commandLoader } = bot;
      const reactionData = database.getReactionData(event.messageID) || global.GoatBot.onReaction.get(String(event.messageID));

      if (reactionData && reactionData.commandName) {
        const command = commandLoader.getCommand(reactionData.commandName);
        if (command && typeof command.onReaction === 'function') {
          const getLang = (...args) => require('../utils.js').getText(command.config.name, ...args);
          return await command.onReaction({
            api, event, bot, logger, database,
            usersData: database.usersData,
            threadsData: database.threadsData,
            Reaction: reactionData, reactionData,
            getLang
          });
        }
      }
    } catch (e) {
      logger.error('Error in message_reaction event handler', { error: e.message });
    }
  }
};
