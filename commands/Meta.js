const axios = require("axios");

module.exports = {
  config: {
    name: "meta",
    aliases: ["llama"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Chat with Meta Llama AI",
    category: "ai",
    usage: "{pn} <question>"
  },

  async onStart({ message, args, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("Please provide a question.");

    try {
      api.setMessageReaction("⏳", event.messageID);
      const res = await axios.get(`https://api.kenliejugar.net/metaai/?text=${encodeURIComponent(prompt)}`);
      const answer = res.data.response || "No response from Meta AI.";

      api.setMessageReaction("✅", event.messageID);
      return message.reply(answer);
    } catch (e) {
      api.setMessageReaction("❌", event.messageID);
      return message.reply("❌ Error connecting to Meta AI.");
    }
  }
};
