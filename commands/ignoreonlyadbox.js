module.exports = {
  config: {
    name: "ignoreonlyadbox",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 2,
    description: "Ignore command not found for group admins",
    category: "config",
    usage: "{pn} on | off"
  },

  async onStart({ message, threadsData, event, args }) {
    const threadID = event.threadID;
    const threadData = await threadsData.get(threadID);
    const action = args[0]?.toLowerCase();

    if (action === "on") {
      await threadsData.set(threadID, { settings: { ...threadData.settings, ignoreAdBox: true } });
      return message.reply("✅ Enabled ignore ad box.");
    } else if (action === "off") {
      await threadsData.set(threadID, { settings: { ...threadData.settings, ignoreAdBox: false } });
      return message.reply("✅ Disabled ignore ad box.");
    }

    return message.reply("❌ Usage: ignoreonlyadbox <on | off>");
  }
};
