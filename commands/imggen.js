const axios = require('axios');

module.exports = {
  config: {
    name: 'imggen',
    aliases: ['imgen', 'imagine'],
    version: '1.0',
    author: 'nexo_here',
    cooldown: 10,
    role: 0,
    description: 'Generate AI image using imgen API',
    category: 'ai-image',
    usage: 'imggen <prompt>'
  },

  onStart: async function ({ message, args, api, event }) {
    const prompt = args.join(' ');
    if (!prompt) return message.reply('❌ | Please provide a prompt.\nExample: imggen A dragon flying over a castle');

    message.reply('🧠 | Generating image, please wait...');
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const url = `https://www.arch2devs.ct.ws/api/imgen?prompt=${encodeURIComponent(prompt)}`;

      await message.reply({
        body: `✅ | Prompt: ${prompt}`,
        attachment: url
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (err) {
      console.error('Imggen error:', err.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      return message.reply('❌ | Failed to generate image. Try again later.');
    }
  }
};
