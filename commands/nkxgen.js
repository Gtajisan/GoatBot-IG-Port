const axios = require("axios");

module.exports = {
  config: {
    name: "nkxgen",
    aliases: ["gen"],
    version: "1.0",
    author: "NeoKEX",
    cooldown: 5,
    role: 0,
    description: "Generate AI image using NeoKEX API",
    category: "ai",
    usage: "{pn} <prompt>"
  },

  async onStart({ message, args, api, event }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("Please provide a prompt.");

    try {
      api.setMessageReaction("⏳", event.messageID);
      const url = `https://nkximggen.onrender.com/generate?prompt=${encodeURIComponent(prompt)}`;

      api.setMessageReaction("✅", event.messageID);
      return message.reply({
        body: `🎨 Generated image for: ${prompt}`,
        attachment: url
      });
    } catch (e) {
      api.setMessageReaction("❌", event.messageID);
      return message.reply("❌ Generation failed.");
    }
  }
};
