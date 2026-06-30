const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "alldl",
    aliases: ["fbdl", "igdl", "ttdl", "ytdl", "dl"],
    version: "2.6",
    author: "Neoaz 🐦",
    cooldown: 5,
    role: 0,
    description: "Multi-platform video/audio downloader (FB, IG, TikTok, YT)",
    category: "media",
    usage: "alldl <url> [--a] or reply to a link"
  },

  onStart: async function ({ message, args, event, api }) {
    if (args[0] === "auto") {
      if (!global.alldl_auto) global.alldl_auto = {};
      const threadID = event.threadID;
      global.alldl_auto[threadID] = !global.alldl_auto[threadID];
      return message.reply(`Auto-download is now ${global.alldl_auto[threadID] ? "ON" : "OFF"}.`);
    }

    let url = args[0];
    let isAudio = args.includes("--a");

    if (event.type === "message_reply") {
      const urlMatch = event.messageReply.body.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        url = urlMatch[0];
        if (args.includes("--a") || args[0] === "--a") isAudio = true;
      }
    }

    if (!url || !url.startsWith("http")) return message.reply("Please provide a valid link.");
    return this.handleDownload({ message, event, api, url, isAudio });
  },

  onChat: async function ({ message, event, api }) {
    const threadID = event.threadID;
    if (!global.alldl_auto?.[threadID] || !event.body) return;
    if (event.body.startsWith(global.GoatBot.config.prefix)) return;

    const urlMatch = event.body.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      // Basic filter to avoid downloading common non-media links if desired,
      // but source repo doesn't seem to have one.
      return this.handleDownload({ message, event, api, url: urlMatch[0], isAudio: false });
    }
  },

  handleDownload: async function ({ message, event, api, url, isAudio }) {
    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);
    const fileName = `alldl_${Date.now()}.${isAudio ? "mp3" : "mp4"}`;
    const filePath = path.join(tempDir, fileName);

    try {
      const res = await axios.get(`https://neoaz.is-a.dev/api/download?url=${encodeURIComponent(url)}`);
      const data = res.data.data;
      if (!data || !data.formats || data.formats.length === 0) throw new Error("No download formats found");

      let downloadUrl = "";
      if (isAudio) {
        const audioFormat = data.formats.find(f => f.quality === "audio_only" || f.ext === "mp3" || f.ext === "m4a" || f.ext === "weba");
        downloadUrl = audioFormat?.url || data.formats[data.formats.length - 1].url;
      } else {
        const videoFormat = data.formats.find(f => f.quality === "hd_no_watermark" || f.quality === "no_watermark" || f.quality === "HD" || f.quality === "Full HD" || f.quality === "720p");
        downloadUrl = videoFormat?.url || data.formats[0].url;
      }

      if (!downloadUrl) throw new Error("Could not find a valid download URL");

      await message.reply({
        body: `✅ | ${data.title || 'Downloaded'}`,
        attachment: downloadUrl
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
      console.error('alldl error:', error.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
