const axios = require('axios');

module.exports = {
  config: {
    name: 'fluxdev',
    version: '1.0.1',
    author: 'nexo_here',
    cooldown: 5,
    role: 0,
    description: 'Generate image using FluxDev API',
    category: 'ai-image',
    usage: 'fluxdev <prompt>'
  },

  onStart: async function ({ message, args, api, event }) {
    const prompt = args.join(' ');
    if (!prompt) return message.reply('⚠️ | Please provide a prompt to generate image.');

    message.reply('🧠 Generating your image, please wait...');
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const res = await axios({
        method: 'POST',
        url: 'https://www.arch2devs.ct.ws/api/flux',
        headers: { 'Content-Type': 'application/json' },
        data: { prompt, width: 1024, height: 1024, steps: 4 },
        responseType: 'arraybuffer'
      });

      await message.reply({
        body: `✅ | Image generated for: ${prompt}`,
        attachment: Buffer.from(res.data, 'binary')
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (error) {
      console.error('FluxDev error:', error.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      return message.reply('❌ | Failed to generate image. Please try again later.');
    }
  }
};
