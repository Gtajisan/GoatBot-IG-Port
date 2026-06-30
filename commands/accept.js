module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "1.0",
    author: "Loid Butter",
    cooldown: 8,
    role: 2,
    description: "Accept or delete pending follow/message requests",
    category: "utility",
    usage: "{pn} list | {pn} add <index> | {pn} del <index>"
  },

  async onStart({ message, api, args }) {
    // For Instagram, 'accept' usually refers to pending message requests
    try {
      const pending = await api.getThreadList(20, 'pending');
      if (!pending || pending.length === 0) return message.reply("📝 No pending requests found.");

      if (args[0] === "list" || !args[0]) {
        let msg = "📝 PENDING REQUESTS:\n";
        pending.forEach((t, i) => msg += `${i + 1}. ${t.name || t.threadID}\n`);
        return message.reply(msg);
      }

      const index = parseInt(args[1]) - 1;
      if (isNaN(index) || !pending[index]) return message.reply("❌ Invalid index.");

      const target = pending[index];
      if (args[0] === "add" || args[0] === "accept") {
        if (typeof api.approvePendingThread === 'function') {
            await api.approvePendingThread(target.threadID);
            return message.reply(`✅ Accepted request from ${target.name || target.threadID}`);
        }
        return message.reply("❌ API does not support approving pending threads yet.");
      } else if (args[0] === "del" || args[0] === "delete") {
          // Deleting is usually just ignoring/unsubscribing
          return message.reply("❌ Delete functionality not implemented.");
      }
    } catch (e) {
      return message.reply(`❌ Error: ${e.message}`);
    }
  }
};
