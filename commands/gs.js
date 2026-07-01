const axios = require("axios");

module.exports = {
  config: {
    name: "goatstore",
    aliases: ["gs"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Access Goat Store",
    category: "utility",
    usage: "{pn}"
  },

  async onStart({ message }) {
    return message.reply("🛍️ Goat Store is currently undergoing maintenance.");
  }
};
