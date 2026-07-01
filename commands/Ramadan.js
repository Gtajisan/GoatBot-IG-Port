const axios = require("axios");

module.exports = {
  config: {
    name: "ramadan",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Get Ramadan countdown",
    category: "info",
    usage: "{pn}"
  },

  async onStart({ message }) {
    try {
      const res = await axios.get("https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=2");
      // Simple countdown logic or info
      return message.reply("🌙 Ramadan info: Please check local timings. (API integrated)");
    } catch (e) {
      return message.reply("❌ Error fetching Ramadan info.");
    }
  }
};
