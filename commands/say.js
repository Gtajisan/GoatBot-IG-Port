const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "say",
    version: "1.7",
    author: "Samir Œ",
    cooldown: 5,
    role: 0,
    category: "tts",
    description: "Convert text to voice with language support",
    usage: "say <text> | <lang_code>"
  },

  onStart: async function ({ api, args, message, event }) {
    let text;
    let lang = 'en';

    if (event.type === "message_reply") {
      text = event.messageReply.body;
      if (args.length > 0) lang = args[0];
    } else {
      if (args && args.length > 0) {
        if (args.join(" ").includes("|")) {
          const splitArgs = args.join(" ").split("|").map(arg => arg.trim());
          text = splitArgs[0];
          lang = splitArgs[1] || 'en';
        } else {
          text = args.join(" ");
        }
      }
    }

    if (!text) {
      return message.reply(`Please provide some text or reply to a message.`);
    }

    const tempPath = path.join(process.cwd(), 'temp', `tts_${Date.now()}.mp3`);
    await fs.ensureDir(path.dirname(tempPath));

    try {
      if (text.length <= 150) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
        await message.reply({
          body: text,
          attachment: url
        });
      } else {
        const chunkSize = 150;
        const chunks = text.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [text];

        for (let i = 0; i < chunks.length; i++) {
          const response = await axios({
            method: "get",
            url: `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunks[i])}`,
            responseType: "arraybuffer"
          });

          await fs.appendFile(tempPath, Buffer.from(response.data));
        }

        await message.reply({
          body: text,
          attachment: fs.createReadStream(tempPath)
        });

        // Cleanup is handled by InstagramBot.js if we pass a stream,
        // but it's safer to delete it here if we want to be sure since we created it.
        // Actually InstagramBot.js: "for (const f of tempFiles) { fs.unlink(f).catch(() => {}); }"
        // It adds to tempFiles if it creates a temp file from a stream.
        // If I pass a ReadStream, it pipes it to a NEW temp file.
        // So I should delete MY temp file after sending.
        setTimeout(() => fs.remove(tempPath).catch(() => {}), 10000);
      }
    } catch (err) {
      console.error(err);
      message.reply("An error occurred during TTS conversion.");
    }
  }
};
