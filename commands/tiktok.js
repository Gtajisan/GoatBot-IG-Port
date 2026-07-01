const axios = require("axios");

module.exports = {
  config: {
    name: "tiktok",
    aliases: ["tt"],
    version: "1.0",
    author: "NeoKEX",
    cooldown: 5,
    role: 0,
    description: "Download TikTok video",
    category: "media",
    usage: "{pn} <url | search keyword>"
  },

  async onStart({ message, args, api, event }) {
    const query = args.join(" ");
    if (!query) return message.reply("Please provide a TikTok URL or search keyword.");

    try {
      api.setMessageReaction("⏳", event.messageID);
      let url = query;
      if (!query.startsWith("http")) {
          const search = await axios.get(`https://neokex-dlapis.vercel.app/api/tiktok/search?q=${encodeURIComponent(query)}`);
          url = search.data.results[0]?.url;
      }

      if (!url) return message.reply("❌ No video found.");

      const res = await axios.get(`https://neokex-dlapis.vercel.app/api/tiktok/download?url=${encodeURIComponent(url)}`);
      const videoUrl = res.data.video.downloadUrl;

      api.setMessageReaction("✅", event.messageID);
      return message.reply({
        body: `🎥 TikTok: ${res.data.title || ""}`,
        attachment: videoUrl
      });
    } catch (e) {
      api.setMessageReaction("❌", event.messageID);
      return message.reply(`❌ Failed to download: ${e.message}`);
    }
  }
};
