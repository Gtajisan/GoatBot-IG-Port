const axios = require("axios");

module.exports = {
  config: {
    name: "coc",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Get Clash of Clans player info",
    category: "info",
    usage: "{pn} <player_tag>"
  },

  async onStart({ message, args }) {
    const tag = args[0];
    if (!tag) return message.reply("Please provide a COC player tag.");

    try {
      const res = await axios.get(`https://api.clashofclans.com/v1/players/${encodeURIComponent(tag)}`, {
          headers: { Authorization: `Bearer ${global.GoatBot.config.COC_API_KEY || ''}` }
      });
      const data = res.data;
      return message.reply(`🏰 Player: ${data.name}\n- Level: ${data.expLevel}\n- Trophies: ${data.trophies}\n- Clan: ${data.clan?.name || 'None'}`);
    } catch (e) {
      return message.reply("❌ Error fetching COC info. Ensure API key is configured.");
    }
  }
};
