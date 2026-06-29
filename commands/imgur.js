const axios = require('axios');

module.exports = {
  config: {
    name: 'imgur',
    version: '1.0.2',
    author: 'MOHAMMAD AKASH',
    role: 0,
    description: 'Upload image/video/GIF to Imgur and get direct links',
    category: 'media',
    usage: '[reply with any media file]'
  },

  onStart: async function ({ api, event, message }) {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return message.reply('Please reply to an image or video.');
    }

    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
      const imgurApi = apis.data.imgur;

      const links = [];
      for (const attachment of event.messageReply.attachments) {
        try {
          const upload = await axios.get(`${imgurApi}/imgur?link=${encodeURIComponent(attachment.url)}`);
          links.push(upload.data.uploaded.image || '❌ No link received');
        } catch (e) {
          links.push('❌ Failed to upload');
        }
      }

      const body = links.length === 1 ? links[0] : `✅ Uploaded files Imgur links:\n\n${links.join('\n')}`;
      await message.reply(body);
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (e) {
      console.error('Imgur error:', e.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      message.reply('❌ Failed to fetch Imgur API.');
    }
  }
};
