const axios = require('axios');

module.exports = {
  config: {
    name: "animate",
    aliases: ["anim", "vido", "mvid"],
    version: "2.0",
    author: "Neoaz ゐ",
    cooldown: 30,
    role: 0,
    description: "Generate or edit videos using Meta AI.",
    category: "ai-video",
    usage: "animate <prompt> or reply to image with animate <prompt>"
  },

  onStart: async function({ message, args, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("Please provide a prompt.");

    const isEdit = event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments[0].type === "photo";
    const endpoint = isEdit ? "https://metabyneokex.vercel.app/videos/edit" : "https://metabyneokex.vercel.app/videos/generate";

    const params = {
      prompt: prompt,
      poll_attempts: 25,
      poll_wait_seconds: 3
    };

    if (isEdit) {
      params.img_url = event.messageReply.attachments[0].url;
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const response = await axios.get(endpoint, {
        params: params,
        timeout: 350000
      });

      const data = response.data;
      if (!data.success || !data.video_urls || data.video_urls.length === 0) {
        throw new Error("Action failed or API returned no video.");
      }

      const videoUrl = data.video_urls[0];

      await message.reply({
        body: "✅ | Video generated/edited successfully",
        attachment: videoUrl
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      const errMsg = error.response?.data?.detail?.[0]?.msg || error.message;
      message.reply(`❌ Error: ${errMsg}`);
    }
  }
};
