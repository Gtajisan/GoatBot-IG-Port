const axios = require('axios');

module.exports = {
  config: {
    name: 'ytb',
    aliases: ['youtube', 'yt'],
    description: 'Download YouTube video or audio',
    usage: 'ytb -v <query> | ytb -a <query>',
    cooldown: 15,
    role: 0,
    category: 'media'
  },

  async onStart({ api, event, args, message }) {
    const type  = args[0];
    const query = args.slice(1).join(' ');

    if (!query || !['-v', '-a'].includes(type)) {
      return message.reply('❌ Invalid usage.\nUsage: ytb -v <query> (video) or ytb -a <query> (audio)');
    }

    message.reaction('⏳');

    try {
      const response = await axios.get(`https://api.jisan-official.com/ytb?query=${encodeURIComponent(query)}&type=${type === '-a' ? 'audio' : 'video'}`);
      const data = response.data;

      if (!data.url) return message.reply('❌ Failed to fetch download link.');

      if (type === '-v') {
          await api.sendVideoFromUrl(event.threadId, data.url, { caption: data.title });
      } else {
          await api.sendVoiceFromUrl(event.threadId, data.url);
      }
      message.reaction('✅');
    } catch (error) {
      console.error('YTB Error:', error.message);
      message.reaction('❌');
      message.reply('❌ Failed to download from YouTube.');
    }
  }
};
