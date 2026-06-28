const axios = require('axios');

module.exports = {
  config: {
    name: 'anisearch',
    aliases: ['anime', 'animeedit'],
    description: 'Search for anime edit videos',
    usage: 'anisearch <query>',
    cooldown: 10,
    role: 0,
    category: 'fun'
  },

  async onStart({ api, event, args, message }) {
    if (args.length === 0) return message.reply('❌ Please provide a search query.');

    const query = args.join(' ');
    message.reaction('✨');

    try {
      const response = await axios.get(`https://api.jisan-official.com/anisearch?query=${encodeURIComponent(query)}`);
      const videos = response.data.results || response.data;

      if (!videos || videos.length === 0) return message.reply('❌ No anime edits found.');

      const selected = videos[Math.floor(Math.random() * videos.length)];
      await api.sendVideoFromUrl(event.threadId, selected.url || selected.videoUrl);
      message.reaction('✅');
    } catch (error) {
      console.error('Anisearch Error:', error.message);
      message.reply('❌ An error occurred while fetching the video.');
    }
  }
};
