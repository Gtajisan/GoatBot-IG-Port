module.exports = {
  config: {
    name: "eval",
    version: "1.0",
    author: "NTKhang",
    cooldown: 0,
    role: 4,
    description: "Evaluate JavaScript code",
    category: "system",
    usage: "{pn} <code>"
  },

  async onStart({ message, event, args, api, bot, database, usersData, threadsData }) {
    const code = args.join(" ");
    if (!code) return message.reply("Please provide code to evaluate.");

    try {
      const result = await eval(`(async () => { ${code} })()`);
      return message.reply(`✅ Result: ${JSON.stringify(result, null, 2)}`);
    } catch (e) {
      return message.reply(`❌ Error: ${e.message}`);
    }
  }
};
