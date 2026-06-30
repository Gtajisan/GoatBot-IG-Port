module.exports = {
  config: {
    name: "setrankup",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 1,
    description: "Customize rankup message",
    category: "config",
    usage: "{pn} <message>"
  },

  async onStart({ message, threadsData, event, args }) {
    const msg = args.join(" ");
    if (!msg) return message.reply("❌ Please provide a message. Use {userName}, {level} as placeholders.");

    await threadsData.set(event.threadID, { data: { ...((await threadsData.get(event.threadID)).data), rankupMessage: msg } });
    return message.reply(`✅ Rankup message set to:\n${msg}`);
  }
};
