const axios = require("axios");

module.exports = {
  config: {
    name: "anime",
    aliases: ["anipub"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Search for anime information",
    category: "info",
    usage: "{pn} <anime name>"
  },

  async onStart({ message, args }) {
    const query = args.join(" ");
    if (!query) return message.reply("Please provide an anime name.");

    try {
      const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
      const anime = res.data.data[0];
      if (!anime) return message.reply("❌ No anime found.");

      let msg = `📺 ANIME INFO: ${anime.title}\n`;
      msg += `- Score: ${anime.score}\n`;
      msg += `- Type: ${anime.type}\n`;
      msg += `- Episodes: ${anime.episodes}\n`;
      msg += `- Status: ${anime.status}\n`;
      msg += `- Synopsis: ${anime.synopsis?.substring(0, 300)}...`;

      return message.reply({
        body: msg,
        attachment: anime.images?.jpg?.image_url
      });
    } catch (e) {
      return message.reply("❌ Error fetching anime info.");
    }
  }
};
