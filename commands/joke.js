const axios = require("axios");

module.exports = {
  config: {
    name: "joke",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Get a random joke",
    category: "fun",
    usage: "{pn}"
  },

  async onStart({ message }) {
    try {
      const res = await axios.get("https://api.popcat.xyz/joke");
      return message.reply(res.data.joke);
    } catch (e) {
      return message.reply("❌ Failed to get joke.");
    }
  }
};
