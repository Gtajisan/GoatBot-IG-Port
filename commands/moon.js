const axios = require("axios");

module.exports = {
  config: {
    name: "moon",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "See the moon phase on a specific date",
    category: "info",
    usage: "{pn} <DD/MM/YYYY>"
  },

  async onStart({ message, args }) {
    const date = args[0];
    if (!date) return message.reply("Please provide a date (DD/MM/YYYY).");

    try {
      const [d, m, y] = date.split("/");
      const url = `https://api.burn.place/moon?d=${d}&m=${m}&y=${y}`;

      return message.reply({
        body: `🌙 Moon phase for ${date}:`,
        attachment: url
      });
    } catch (e) {
      return message.reply("❌ Error fetching moon phase.");
    }
  }
};
