const logger = require('../utils/logger');
const PermissionManager = require('../utils/permissions');
const database = require('../utils/database');

const ANGER_EMOJIS = ['😠', '😡'];

module.exports = {
  config: { name: 'message_reaction', description: 'Unsend bot messages on anger reaction' },
  async run(bot, event) {
    try {
      const { senderID, threadId, reaction, targetMessageId, reactionStatus } = event;
      if (!reaction || !ANGER_EMOJIS.includes(reaction)) return;
      if (reactionStatus === 'deleted') return;
      if (PermissionManager.getUserRole(senderID) < 2) return;
      const msgs = database.getAllSentMessages(threadId);
      if (!msgs.some(m => m.itemId === targetMessageId)) return;
      await bot.api.unsendMessage(threadId, targetMessageId);
      logger.info('Message unsent via anger reaction', { senderID, threadId, targetMessageId });
    } catch (e) { logger.error('Error in message_reaction event', { error: e.message }); }
  }
};
