const axios = require('axios');

module.exports = {
  config: {
    name: 'creart',
    version: '1.2',
    author: 'nexo_here',
    cooldown: 5,
    role: 0,
    description: 'Generate AI image using CreartAI',
    category: 'ai-image',
    usage: 'creart <prompt>'
  },

  onStart: async function ({ message, args, api, event }) {
    const prompt = args.join(' ');
    if (!prompt) return message.reply('❌ | Please provide a prompt to generate image.');

    message.reply(`⏳ | Generating image for: "${prompt}"`);
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const url = `https://smfahim.xyz/creartai?prompt=${encodeURIComponent(prompt)}`;
      // Our sendMessage handles URL attachments automatically
      await message.reply({
        body: `✅ | Here is your image for: "${prompt}"`,
        attachment: url
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (error) {
      console.error('Creart error:', error.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      return message.reply('❌ | Failed to generate image. Try again later.');
    }
  }
};
