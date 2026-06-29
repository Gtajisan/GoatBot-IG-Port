const axios = require("axios");
const fs = require("fs");
const yts = require("yt-search");
const path = require("path");

module.exports = {
 config: {
 name: "video",
 version: "2.2",
 aliases: ["vdo"],
 author: "Rômeo",
 cooldown: 10,
 role: 0,
 description: "Search and download video from YouTube",
 category: "media",
 usage: "video <search term or URL>"
 },

 onStart: async ({ api, args, event, message }) => {
 if (args.length < 1) return message.reply("❌ Please use the format 'video <search term or URL>'.");

 const input = args.join(" ");
 if (input.startsWith("http")) {
   return downloadDirectVideo(api, event, input, null, message);
 }

 try {
 const searchResults = await yts(input);
 const videos = searchResults.videos.slice(0, 6);
 if (videos.length === 0) return message.reply(`⭕ No results found for: ${input}`);

 let msg = "";
 videos.forEach((video, index) => {
 msg += `${index + 1}. ${video.title}\nDuration: ${video.timestamp}\nChannel: ${video.author.name}\n\n`;
 });

 await message.reply(
 {
 body: msg + "Reply with a number to select."
 },
 (err, info) => {
   global.GoatBot.onReply.set(info.messageID, {
   commandName: "video",
   messageID: info.messageID,
   author: event.senderID,
   videos,
   });
 }
 );
 } catch (error) {
 console.error(error);
 return message.reply("❌ Failed to search YouTube.");
 }
 },

 onReply: async ({ event, api, Reply, message }) => {
 if (event.senderID != Reply.author) return;
 await api.unsendMessage(Reply.messageID);
 message.reaction("⏳");

 const choice = parseInt(event.body);
 if (isNaN(choice) || choice <= 0 || choice > Reply.videos.length) return message.reply("❌ Please enter a valid number.");

 downloadDirectVideo(api, event, Reply.videos[choice - 1].url, Reply.videos[choice - 1], message);
 },
};

async function downloadDirectVideo(api, event, videoUrl, videoInfo, message) {
 try {
 const BASE_URL = await getApiUrl();
 if (!BASE_URL) return message.reply("❌ Could not fetch API URL. Try again later.");

 const { data } = await axios.get(`${BASE_URL}/api/ytb?url=${encodeURIComponent(videoUrl)}`);
 const mp4Url = data.mp4 || data.url;
 if (!mp4Url) return message.reply("❌ Could not retrieve a video file.");

 const videoPath = path.join(__dirname, "tmp", `ytb_video_${Date.now()}.mp4`);
 await downloadFile(mp4Url, videoPath);

 const title = videoInfo ? videoInfo.title : (data.title || "Unknown Title");
 const channel = videoInfo ? videoInfo.author.name : (data.author || "Unknown Channel");

 message.reaction("✅");
 await message.reply(
 {
 body: `📥 Video download successful:\n• Title: ${title}\n• Channel: ${channel}`,
 attachment: fs.createReadStream(videoPath),
 },
 () => fs.unlinkSync(videoPath)
 );
 } catch (e) {
 console.error(e);
 return message.reply("❌ Failed to download.");
 }
}

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
