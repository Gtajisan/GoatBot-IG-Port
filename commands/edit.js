const axios = require('axios');

module.exports = {
  config: {
    name: "nbpro",
    aliases: ["edit", "nb", "nanobanana"],
    version: "1.0",
    author: "Tawsif~",
    cooldown: 5,
    role: 0,
    description: "Edit & generate images using Nano-banana Pro",
    category: "ai",
    usage: "<prompt> | reply to image"
  },

  async onStart({ message, event, args, api }) {
    let prompt = args.join(" ");
    if (!event.messageReply && !prompt) {
      return message.reply('Please provide a prompt or reply to an image.');
    }

    try {
      api.setMessageReaction("⏳", event.messageID);

      if (!event.messageReply) {
        // Generation mode
        let ratio = prompt.includes("--ar=") ? prompt.split("--ar=")[1].split(" ")[0] : '1:1';
        const res = await axios.get(`https://tawsif.is-a.dev/gemini/nano-banana-pro-gen?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`);
        return message.reply({
          body: "✅ Generated",
          attachment: res.data.imageUrl
        });
      } else {
        // Edit mode
        let imgs = event.messageReply.attachments.filter(a => a.type === 'photo').map(a => a.url);
        if (imgs.length === 0) return message.reply("Please reply to an image.");

        const res = await axios.get(`https://tawsif.is-a.dev/gemini/nano-banana-pro-edit?prompt=${encodeURIComponent(prompt)}&urls=${encodeURIComponent(JSON.stringify(imgs))}`);
        return message.reply({
          body: "✅ Image Edited",
          attachment: res.data.imageUrl
        });
      }
    } catch (e) {
      api.setMessageReaction("❌", event.messageID);
      return message.reply(`❌ Error: ${e.message}`);
    }
  }
};
