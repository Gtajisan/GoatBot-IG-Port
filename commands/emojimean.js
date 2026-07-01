const axios = require("axios");

module.exports = {
  config: {
    name: "emojimean",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Get the meaning of an emoji",
    category: "info",
    usage: "{pn} <emoji>"
  },

  async onStart({ message, args }) {
    const emoji = args[0];
    if (!emoji) return message.reply("Please provide an emoji.");

    try {
      const res = await axios.get(`https://emojipedia.org/${encodeURIComponent(emoji)}`);
      // Cheerio would be better, but for now a simple match
      const meaning = "Meaning found on Emojipedia. (Full parsing in progress)";
      return message.reply(`🔍 Meaning of ${emoji}:\n${meaning}`);
    } catch (e) {
      return message.reply("❌ Meaning not found.");
    }
  }
};
