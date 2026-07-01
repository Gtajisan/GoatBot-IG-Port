const axios = require("axios");

module.exports = {
  config: {
    name: "4o",
    aliases: ["gpt4", "ai", "ask"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Chat with GPT-4o AI",
    category: "ai",
    usage: "{pn} <question>"
  },

  async onStart({ message, args, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("Please provide a question.");

    try {
      api.setMessageReaction("⏳", event.messageID);
      const res = await axios.get(`https://api.kenliejugar.net/gpt4o/?text=${encodeURIComponent(prompt)}`);
      const answer = res.data.response || "No response from AI.";

      api.setMessageReaction("✅", event.messageID);
      return message.reply(answer);
    } catch (e) {
      api.setMessageReaction("❌", event.messageID);
      return message.reply("❌ Error connecting to GPT-4o service.");
    }
  }
};
