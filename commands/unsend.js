module.exports = {
  config: {
    name: "unsend",
    aliases: ["u", "un", "del", "delete"],
    version: "1.3",
    author: "NTKhang & Gtajisan",
    cooldown: 5,
    role: 0,
    description: "Unsend bot's message",
    category: "utility",
    usage: "reply to the message you want to unsend or just type {pn}"
  },

  async onStart({ message, event, api, database }) {
    const targetID = event.messageReply ? event.messageReply.messageID : (event.replyToItemId || null);

    if (targetID) {
        return await api.unsendMessage(targetID).catch(err => {
             message.err("Failed to unsend: " + err.message);
        });
    }

    const last = database.getLastSentMessage(event.threadId);
    if (!last) return message.reply('ℹ️ No recent bot message to unsend. Reply to a message to unsend it.');

    await api.unsendMessage(last.itemId).catch(err => {
         message.err("Failed to unsend: " + err.message);
    });
  }
};