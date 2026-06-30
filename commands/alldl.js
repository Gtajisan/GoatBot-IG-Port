const axios = require("axios");

module.exports = {
  config: {
    name: "alldl",
    aliases: ["download"],
    version: "1.0",
    author: "NeoKEX",
    cooldown: 5,
    role: 0,
    description: "Multi-platform video/audio downloader",
    category: "media",
    usage: "{pn} <url>"
  },

  async onStart({ message, args, api, event }) {
    const url = args[0];
    if (!url) return message.reply("Please provide a URL.");

    try {
      api.setMessageReaction("⏳", event.messageID);
      const res = await axios.get(`https://neokex-dlapis.vercel.app/api/alldl?url=${encodeURIComponent(url)}`);
      const data = res.data;

      const mediaUrl = data.video?.downloadUrl || data.audio?.downloadUrl || data.downloadUrl;
      if (!mediaUrl) throw new Error("Could not find download link.");

      api.setMessageReaction("✅", event.messageID);
      return message.reply({
        body: `✅ Downloaded: ${data.title || "Media"}`,
        attachment: mediaUrl
      });
    } catch (e) {
      api.setMessageReaction("❌", event.messageID);
      return message.reply(`❌ Download failed: ${e.message}`);
    }
  }
};
