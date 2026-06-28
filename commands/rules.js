module.exports = {
  config: {
    name: "rules",
    version: "1.6",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Create/view/add/edit/delete group rules",
    category: "box chat"
  },

  async onStart({ role, args, message, event, threadsData, commandName, database }) {
    const { threadId, senderID } = event;
    const type = args[0];
    const threadData = await threadsData.get(threadId);
    if (!threadData.data) threadData.data = {};
    const rulesOfThread = threadData.data.rules || [];

    if (!type) {
      let msg = "";
      rulesOfThread.forEach((rule, i) => msg += `${i + 1}. ${rule}\n`);
      if (!msg) return message.reply("Your group has no rules. Use `rules add <rule>` to add one.");

      const sent = await message.reply(`Your group rules:\n${msg}\nReply with the number to see the full rule.`);
      if (sent && sent.messageID) {
          database.setReplyData(sent.messageID, { commandName, rulesOfThread, author: senderID });
      }
    }
    else if (["add", "-a"].includes(type)) {
      if (role < 1) return message.reply("Only admins can add rules.");
      const rule = args.slice(1).join(" ");
      if (!rule) return message.reply("Please enter the rule content.");
      rulesOfThread.push(rule);
      threadData.data.rules = rulesOfThread;
      await threadsData.set(threadId, threadData);
      message.reply("Added new rule successfully.");
    }
    else if (["delete", "del", "-d"].includes(type)) {
      if (role < 1) return message.reply("Only admins can delete rules.");
      const index = parseInt(args[1]) - 1;
      if (isNaN(index) || !rulesOfThread[index]) return message.reply("Invalid rule number.");
      const removed = rulesOfThread.splice(index, 1);
      threadData.data.rules = rulesOfThread;
      await threadsData.set(threadId, threadData);
      message.reply(`Deleted rule: ${removed}`);
    }
    else if (["remove", "reset", "-r"].includes(type)) {
        if (role < 1) return message.reply("Only admins can remove all rules.");
        threadData.data.rules = [];
        await threadsData.set(threadId, threadData);
        message.reply("Removed all group rules.");
    }
  },

  async handleReply({ message, event, replyData }) {
    if (replyData.author !== event.senderID) return;
    const num = parseInt(event.body);
    if (isNaN(num) || !replyData.rulesOfThread[num - 1]) return;
    message.reply(`Rule ${num}: ${replyData.rulesOfThread[num - 1]}`);
  }
};
