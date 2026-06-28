const axios = require('axios');

module.exports = {
  config: {
    name: 'alldl',
    aliases: ['dl', 'fbdl', 'igdl', 'ttdl', 'ytdl'],
    description: 'Download video/audio from various platforms (FB, IG, YT, TT, etc)',
    usage: 'alldl <url>',
    role: 0,
    cooldown: 15,
    category: 'media'
  },

  async onStart({ api, event, args, message }) {
    const url = args[0];
    if (!url || !url.startsWith('http')) return message.reply('Please provide a valid URL.');

    message.reaction('⏳');

    try {
      const response = await axios.get(`https://api.jisan-official.com/alldl?url=${encodeURIComponent(url)}`);
      const data = response.data;

      if (!data.url) return message.reply('❌ Failed to fetch download link.');

      if (data.type === 'video') {
          await api.sendVideoFromUrl(event.threadId, data.url, { caption: data.title || '✅ Downloaded' });
      } else if (data.type === 'audio') {
          await api.sendVoiceFromUrl(event.threadId, data.url);
      } else if (data.type === 'image') {
          await api.sendPhotoFromUrl(event.threadId, data.url);
      } else {
          message.reply(`Here is your download link: ${data.url}`);
      }
      message.reaction('✅');
    } catch (error) {
      console.error('AllDL Error:', error.message);
      message.reaction('❌');
      message.reply('❌ An error occurred during download.');
    }
  }
};
