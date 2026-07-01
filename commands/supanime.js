const axios = require("axios");

module.exports = {
  config: {
    name: "supanime",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Get random anime wallpaper",
    category: "image",
    usage: "{pn}"
  },

  async onStart({ message }) {
    try {
      const url = "https://api.waifu.pics/sfw/waifu";
      const res = await axios.get(url);
      return message.reply({ attachment: res.data.url });
    } catch (e) {
      return message.reply("❌ Error fetching image.");
    }
  }
};
