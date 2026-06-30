const axios = require("axios");

module.exports = {
  config: {
    name: "maze",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Generate a maze image",
    category: "fun",
    usage: "{pn} <size>"
  },

  async onStart({ message, args }) {
    const size = args[0] || 10;
    const url = `https://api.popcat.xyz/maze?size=${size}`;
    return message.reply({ attachment: url });
  }
};
