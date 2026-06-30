module.exports = {
  config: {
    name: "grouptag",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 1,
    description: "Manage group-wide tags",
    category: "config",
    usage: "{pn} add <tag_name> | <@tags...> | {pn} list"
  },

  async onStart({ message, threadsData, event, args }) {
    const threadID = event.threadID;
    const threadData = await threadsData.get(threadID);
    const groupTags = threadData?.data?.groupTags || {};

    const action = args[0]?.toLowerCase();
    if (action === "add") {
      const content = args.slice(1).join(" ").split("|").map(s => s.trim());
      if (content.length < 2) return message.reply("❌ Usage: grouptag add <tag_name> | <mentions>");
      groupTags[content[0].toLowerCase()] = content[1];
      await threadsData.set(threadID, { data: { ...threadData.data, groupTags } });
      return message.reply(`✅ Added group tag: ${content[0]}`);
    } else if (action === "list") {
      const keys = Object.keys(groupTags);
      return message.reply(`📝 Group Tags: ${keys.join(", ") || "None"}`);
    }

    return message.reply(`『 USAGE 』\n${this.config.usage.replace(/\{pn\}/g, 'grouptag')}`);
  }
};
