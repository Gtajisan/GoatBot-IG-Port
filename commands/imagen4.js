const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const API_ENDPOINT = 'https://neokex-img-api.vercel.app/generate';

module.exports = {
  config: {
    name: 'imagen4',
    aliases: ['img4', 'gen4'],
    description: 'Generate a high-quality image using the Imagen 4 model',
    usage: 'imagen4 <prompt>',
    cooldown: 15,
    role: 0,
    category: 'ai'
  },

  async onStart({ api, event, args, logger, message }) {
    const prompt = args.join(' ').trim();
    if (!prompt) return message.reply('❌ Please provide a prompt.\n\nUsage: imagen4 <prompt>');

    message.reaction('🎨');

    try {
      const imageUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt)}&m=imagen4`;
      await message.reply({ attachment: imageUrl });
      message.reaction('✅');
    } catch (error) {
      logger.error('imagen4 error', { error: error.message });
      message.reaction('❌');
      return message.reply('❌ Failed to generate image. Please try again.');
    }
  }
};
