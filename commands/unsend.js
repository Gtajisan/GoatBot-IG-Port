module.exports = {
  config: {
    name: "unsend",
    aliases: ["delete"],
    version: "1.2",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Unsend bot's message",
    category: "utility"
  },

  async onStart({ message, event, api, database }) {
    if (event.replyToItemId) {
        return await api.unsendMessage(event.replyToItemId);
    }

    const last = database.getLastSentMessage(event.threadId);
    if (!last) return message.reply('ℹ️ No recent bot message to unsend. Reply to a message to unsend it.');

    await api.unsendMessage(last.itemId);
  }
};
