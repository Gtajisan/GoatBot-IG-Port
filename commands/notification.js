module.exports = {
  config: {
    name: "notification",
    aliases: ["noti", "sendnoti"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 2,
    description: "Send notification to all groups",
    category: "admin",
    usage: "{pn} <message>"
  },

  async onStart({ message, api, args, bot }) {
    const text = args.join(" ");
    if (!text) return message.reply("Please provide a message to send.");

    try {
      const inbox = await api.getThreadList(100, 'inbox');
      const threads = (inbox?.threads || inbox?.items || []).filter(t => t.isGroup || t.is_group);

      let count = 0;
      for (const t of threads) {
        try {
          await api.sendMessage(`📢 NOTIFICATION\n━━━━━━━━━━━━━\n${text}`, t.threadID);
          count++;
        } catch (e) {}
      }
      return message.reply(`✅ Sent notification to ${count} groups.`);
    } catch (e) {
      return message.reply(`❌ Failed to send notification: ${e.message}`);
    }
  }
};
