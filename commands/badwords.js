module.exports = {
  config: {
    name: "badwords",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 1,
    description: "Manage badwords list for the group",
    category: "moderation",
    usage: "{pn} add <word> | {pn} remove <word> | {pn} list | {pn} on | {pn} off"
  },

  async onStart({ message, threadsData, event, args }) {
    const threadID = event.threadID;
    const threadData = await threadsData.get(threadID);
    const settings = threadData?.settings || {};
    const badwords = settings.badwords || { list: [], enabled: false };

    const action = args[0]?.toLowerCase();
    if (action === "add") {
      const word = args.slice(1).join(" ");
      if (!word) return message.reply("❌ Please provide a word to add.");
      if (badwords.list.includes(word)) return message.reply("❌ Word already in list.");
      badwords.list.push(word);
      await threadsData.set(threadID, { settings: { ...settings, badwords } });
      return message.reply(`✅ Added "${word}" to badwords list.`);
    } else if (action === "remove" || action === "delete") {
      const word = args.slice(1).join(" ");
      const index = badwords.list.indexOf(word);
      if (index === -1) return message.reply("❌ Word not found in list.");
      badwords.list.splice(index, 1);
      await threadsData.set(threadID, { settings: { ...settings, badwords } });
      return message.reply(`✅ Removed "${word}" from badwords list.`);
    } else if (action === "list") {
      if (badwords.list.length === 0) return message.reply("📝 Badwords list is empty.");
      return message.reply(`📝 Badwords list:\n${badwords.list.join(", ")}`);
    } else if (action === "on") {
      badwords.enabled = true;
      await threadsData.set(threadID, { settings: { ...settings, badwords } });
      return message.reply("✅ Badwords filter enabled.");
    } else if (action === "off") {
      badwords.enabled = false;
      await threadsData.set(threadID, { settings: { ...settings, badwords } });
      return message.reply("✅ Badwords filter disabled.");
    }

    return message.reply(`『 USAGE 』\n${this.config.usage.replace(/\{pn\}/g, 'badwords')}`);
  }
};
