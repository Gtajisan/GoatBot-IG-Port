module.exports = {
  config: {
    name: "adboxonly",
    aliases: ["abo"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 2,
    description: "Toggle admin-box-only mode",
    category: "config",
    usage: "{pn} on | off"
  },

  async onStart({ message, threadsData, event, args }) {
    const threadID = event.threadID;
    const threadData = await threadsData.get(threadID);
    const action = args[0]?.toLowerCase();

    if (action === "on") {
      await threadsData.set(threadID, { settings: { ...threadData.settings, adboxOnly: true } });
      return message.reply("✅ Enabled admin-box-only mode.");
    } else if (action === "off") {
      await threadsData.set(threadID, { settings: { ...threadData.settings, adboxOnly: false } });
      return message.reply("✅ Disabled admin-box-only mode.");
    }

    return message.reply("❌ Usage: adboxonly <on | off>");
  }
};
