module.exports = {
  config: { name: 'unsend', aliases: ['delete'], description: 'Unsend last bot message', usage: 'unsend', role: 2, cooldown: 5, category: 'admin' },
  async run({ api, event, database, logger }) {
    try {
      const last = database.getLastSentMessage(event.threadId);
      if (!last) return api.sendMessage('ℹ️ No recent bot message to unsend.', event.threadId);
      await api.unsendMessage(event.threadId, last.itemId);
    } catch (e) { logger.error('Error in unsend', { error: e.message }); }
  }
};
