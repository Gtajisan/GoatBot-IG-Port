const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music"],
    version: "1.1.1",
    author: "Neoaz 🐊",
    cooldown: 5,
    role: 0,
    description: "Search and download YouTube audio",
    category: "media",
    usage: "sing <song name>"
  },

  onStart: async function ({ message, args, event, api, commandName }) {
    const query = args.join(" ");
    if (!query) return message.reply("Please provide a song name.");

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      const res = await axios.get(`https://neokex-dlapis.vercel.app/api/search?q=${encodeURIComponent(query)}`);
      const results = res.data.results.slice(0, 6);

      if (results.length === 0) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply("No songs found.");
      }

      let msg = "";
      results.forEach((v, i) => {
        msg += `${i + 1}. ${v.title}\n[${v.duration}]\n\n`;
      });

      await message.reply({ body: msg.trim() + "\n\nReply with number to download audio." }, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          author: event.senderID,
          results
        });
      });
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (e) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("Search error.");
    }
  },

  onReply: async function ({ message, event, Reply, api }) {
    if (event.senderID !== Reply.author) return;
    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > Reply.results.length) return;

    const selected = Reply.results[choice - 1];
    api.unsendMessage(event.messageReply.messageID);
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const dlRes = await axios.get(`https://neokex-dlapis.vercel.app/api/alldl?url=${encodeURIComponent(selected.url)}`);
      const pollUrl = dlRes.data.audio.downloadUrl;

      let streamUrl = null;
      for (let i = 0; i < 60; i++) {
        const statusRes = await axios.get(pollUrl);
        if (statusRes.data.status === "completed") {
          streamUrl = statusRes.data.viewUrl;
          break;
        }
        await new Promise(r => setTimeout(r, 1000));
      }

      if (!streamUrl) throw new Error("Processing timeout.");

      await message.reply({
        body: `🎵 | ${selected.title}`,
        attachment: streamUrl
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (e) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("Download error.");
    }
  }
};
