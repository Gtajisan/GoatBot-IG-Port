const axios = require('axios');

module.exports = {
  config: {
    name: 'flux3',
    aliases: ['fluxv3', 'fluxaws'],
    version: '1.0',
    author: 'nexo_here',
    cooldown: 10,
    role: 0,
    description: 'Generate AI image using FluxAWS API',
    category: 'ai-image',
    usage: 'flux3 <prompt> | [ratio]'
  },

  onStart: async function ({ message, args, api, event }) {
    const input = args.join(' ').split('|');
    const query = input[0]?.trim();
    const ration = input[1]?.trim() || '1';

    if (!query) return message.reply('❌ | Please provide a prompt.\nExample: flux3 A dragon on Mars | 1.5');

    message.reply('⚙️ | Generating image, please wait...');
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const url = `https://www.arch2devs.ct.ws/api/fluxaws?query=${encodeURIComponent(query)}&ration=${ration}`;

      await message.reply({
        body: `🧠 Prompt: ${query}\n📐 Ratio: ${ration}`,
        attachment: url
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (err) {
      console.error('Flux3 error:', err.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      return message.reply('❌ | Failed to generate image. Please try again later.');
    }
  }
};
