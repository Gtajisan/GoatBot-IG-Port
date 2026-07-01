const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "imgbb",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Upload image to ImgBB",
    category: "utility",
    usage: "Reply to an image with {pn}"
  },

  async onStart({ message, event, api }) {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return message.reply("Please reply to an image to upload.");
    }

    const attachment = event.messageReply.attachments[0];
    if (attachment.type !== 'photo') return message.reply("Only images are supported.");

    try {
      api.setMessageReaction("⏳", event.messageID);

      const imgRes = await axios.get(attachment.url, { responseType: "arraybuffer" });
      const form = new FormData();
      form.append("image", Buffer.from(imgRes.data).toString("base64"));

      const uploadRes = await axios.post(`https://api.imgbb.com/1/upload?key=c2c51086443c7b649363d6f784e1b71d`, form, {
        headers: form.getHeaders()
      });

      api.setMessageReaction("✅", event.messageID);
      return message.reply(`✅ Uploaded successfully!\nURL: ${uploadRes.data.data.url}`);
    } catch (e) {
      api.setMessageReaction("❌", event.messageID);
      return message.reply(`❌ Upload failed: ${e.message}`);
    }
  }
};
