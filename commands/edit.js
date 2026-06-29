const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const noobcore = "https://raw.githubusercontent.com/noobcore404/NC-STORE/main/NCApiUrl.json";

async function getRenzApi() {
  const res = await axios.get(noobcore, { timeout: 10000 });
  if (!res.data?.renz) throw new Error("Renz API not found in JSON");
  return res.data.renz;
}

module.exports = {
  config: {
    name: "edit",
    aliases: ["nanobanana", "gptimage"],
    version: "1.1",
    author: "Gtajisan",
    cooldown: 5,
    role: 0,
    description: "Generate or edit images using text prompts",
    category: "image",
    usage: "{pn} <prompt> | Reply to an image with your prompt"
  },

  onStart: async function ({ api, event, args, message, logger }) {
    const prompt = args.join(" ").trim();
    if (!prompt) {
      return message.reply(
        "❌ Please provide a prompt.\n\nExamples:\n!edit a cyberpunk city\n!edit make me anime (reply to an image)"
      );
    }

    message.reaction("⏳");
    const loadingMsg = await message.reply("⏳ Processing your image...");

    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, `${Date.now()}_edit.png`);

    try {
      const BASE_URL = await getRenzApi();
      let apiURL = `${BASE_URL}/api/gptimage?prompt=${encodeURIComponent(prompt)}`;

      const reply = event.messageReply;
      let hasImageReply = false;
      if (reply && Array.isArray(reply.attachments) && reply.attachments.length > 0) {
        const photo = reply.attachments.find(a => a.type === "photo" || a.type === "image");
        if (photo) {
          hasImageReply = true;
          apiURL += `&ref=${encodeURIComponent(photo.url)}`;
          if (photo.width && photo.height) {
            apiURL += `&width=${photo.width}&height=${photo.height}`;
          }
        }
      }

      if (!hasImageReply) {
        apiURL += `&width=512&height=512`;
      }

      const res = await axios.get(apiURL, { responseType: "arraybuffer", timeout: 180000 });

      await fs.ensureDir(cacheDir);
      await fs.writeFile(imgPath, res.data);

      if (loadingMsg && loadingMsg.messageID) {
        await api.unsendMessage(loadingMsg.messageID).catch(() => {});
      }

      await message.reply({
        body: hasImageReply
          ? `🖌 Image edited successfully.\nPrompt: ${prompt}\n\n(Tap to hold to save/view image)`
          : `🖼 Image generated successfully.\nPrompt: ${prompt}\n\n(Tap to hold to save/view image)`,
        attachment: fs.createReadStream(imgPath)
      });

      message.reaction("✅");

      setTimeout(() => fs.unlink(imgPath).catch(() => {}), 10000);
    } catch (err) {
      logger.error("EDIT Command Error:", err?.response?.data || err.message);

      if (loadingMsg && loadingMsg.messageID) {
        await api.unsendMessage(loadingMsg.messageID).catch(() => {});
      }

      message.reaction("❌");
      message.reply("❌ Failed to process image. Please try again later.");

      if (await fs.pathExists(imgPath)) {
        await fs.unlink(imgPath).catch(() => {});
      }
    }
  }
};
