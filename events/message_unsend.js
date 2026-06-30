'use strict';

module.exports = {
  config: {
    name: 'message_unsend'
  },
  async run({ api, event, bot, logger, database }) {
    try {
      // Goat Bot V2 often has a setting to prevent unsending or to log it
      const { threadId, senderID } = event;
      const threadData = database.getThreadData(threadId);

      if (threadData?.settings?.antiUnsend) {
        // Implementation for anti-unsend would go here
        // Usually requires storing messages in cache
      }
    } catch (e) {
      logger.error('Error in message_unsend event handler', { error: e.message });
    }
  }
};
