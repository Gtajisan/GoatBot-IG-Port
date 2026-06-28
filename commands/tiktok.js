const axios = require('axios');

module.exports = {
  config: {
    name: 'tiktok',
    description: 'Download TikTok videos without watermark',
    usage: 'tiktok <url>',
    role: 0,
    cooldown: 10,
    category: 'media'
  },

  async onStart({ api, event, args, message, bot }) {
    const url = args[0];
    if (!url || !url.includes('tiktok.com')) return message.reply('Please provide a valid TikTok URL.');

    try {
      message.reaction('⏳');
      const response = await axios.get(`https://api.jisan-official.com/tiktok?url=${encodeURIComponent(url)}`);
      const data = response.data;

      if (!data.video_url) return message.reply('Failed to fetch video URL.');

      await api.sendVideoFromUrl(event.threadId, data.video_url, {
          caption: `🎥 Tiktok Download\n👤 User: ${data.author || 'Unknown'}\n📝 Caption: ${data.title || 'No Title'}`
      });
      message.reaction('✅');
    } catch (error) {
      console.error('TikTok Error:', error.message);
      message.reply('An error occurred while downloading the TikTok video.');
    }
  }
};
