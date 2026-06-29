const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

module.exports = {
  config: {
    name: 'catbox',
    version: '1.0.1',
    author: 'Ajmaul',
    role: 0,
    description: 'Upload media to Catbox',
    category: 'media',
    usage: '[reply to image/video/audio]',
    cooldown: 5
  },

  onStart: async function ({ api, event, message }) {
    if (event.type !== 'message_reply' || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return message.reply('❐ Please reply to a photo/video/audio file.');
    }

    message.reply('⏳ Uploading to Catbox...');
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      let msg = '';
      for (const attachment of event.messageReply.attachments) {
        const stream = await global.utils.getStreamFromURL(attachment.url);
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', stream);

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
          headers: form.getHeaders(),
        });
        msg += `${response.data.trim()}\n`;
      }

      await message.reply(msg.trim());
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (err) {
      console.error('Catbox error:', err.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      message.reply('❌ Upload failed.');
    }
  }
};
