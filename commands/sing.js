const axios = require("axios");
const fs = require("fs");
const yts = require("yt-search");
const path = require("path");

module.exports = {
 config: {
  name: "sing",
  version: "2.0",
  author: "Team Calyx",
  description: "Search and download audio from YouTube",
  category: "media",
  usage: "sing <search term>",
  cooldown: 10
 },

 onStart: async ({ api, args, event, message }) => {
  if (!args.length) {
   return message.reply("❌ Use 'sing <search term>'.");
  }

  try {
   message.reaction("⏳");

   const search = await yts(args.join(" "));
   const video = search.videos[0];
   if (!video) {
    message.reaction("⭕");
    return message.reply(`⭕ No results for: ${args.join(" ")}`);
   }

   const BASE_URL = await getApiUrl();
   if (!BASE_URL) {
    message.reaction("❌");
    return message.reply("❌ Could not fetch API URL.");
   }

   const response = await axios.get(`${BASE_URL}/api/ytmp3?url=${encodeURIComponent(video.url)}`);
   const downloadUrl = response.data?.download_url || response.data?.url;

   if (!downloadUrl) {
    message.reaction("❌");
    return message.reply("❌ Could not get MP3 link. Try again later.");
   }

   const audioPath = path.join(__dirname, "tmp", `ytb_audio_${video.videoId}.mp3`);
   await downloadFile(downloadUrl, audioPath);

   message.reaction("✅");
   await message.reply(
    {
     body: `🎵 Song Downloaded Successfully:\n• Title: ${video.title}\n• Channel: ${video.author.name}`,
     attachment: fs.createReadStream(audioPath),
    },
    () => fs.unlinkSync(audioPath)
   );
  } catch (e) {
   console.error("Error in sing command:", e.message || e);
   message.reaction("❌");
   message.reply("❌ Error occurred while downloading. Try again later.");
  }
 },
};

async function downloadFile(url, filePath) {
 const response = await axios({
  url,
  method: "GET",
  responseType: "stream",
 });
 const writer = fs.createWriteStream(filePath);
 response.data.pipe(writer);
 return new Promise((resolve, reject) => {
  writer.on("finish", resolve);
  writer.on("error", reject);
 });
}

async function getApiUrl() {
 try {
  const { data } = await axios.get(
   "https://raw.githubusercontent.com/romeoislamrasel/romeobot/refs/heads/main/api.json"
  );
  return data.api;
 } catch (error) {
  return null;
 }
}
