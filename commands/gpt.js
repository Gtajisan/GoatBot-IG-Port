const axios = require('axios');

module.exports = {
  config: {
    name: 'gpt',
    aliases: ['ai', 'ask'],
    description: 'Chat with AI powered by GPT-4',
    usage: 'gpt <message>',
    role: 0,
    cooldown: 5,
    category: 'ai'
  },

  async onStart({ api, event, args, message }) {
    const prompt = args.join(' ');
    if (!prompt) return message.reply('Please provide a prompt.');

    try {
      message.reaction('⏳');
      const response = await axios.get(`https://api.jisan-official.com/gpt4?prompt=${encodeURIComponent(prompt)}`);
      const answer = response.data.response || response.data.answer || "No response from AI.";

      message.reply(answer);
      message.reaction('✅');
    } catch (error) {
      console.error('GPT Error:', error.message);
      message.reply('An error occurred while connecting to AI service.');
    }
  }
};
