const axios = require('axios');

module.exports = {
  config: {
    name: 'claude',
    aliases: ['cld'],
    version: '1.0',
    author: 'Ajmaul',
    description: 'Ask Claude 3 (Haiku)',
    category: 'ai',
    usage: 'claude <your question> or reply to an image'
  },

  onStart: async function ({ api, event, args, message }) {
    const apikey = '66e0cfbb-62b8-4829-90c7-c78cacc72ae2';
    let query;

    const reply = event.messageReply;
    if (reply && reply.attachments && reply.attachments.length > 0 && reply.attachments[0].type === 'photo') {
      query = reply.attachments[0].url;
    } else if (args.length > 0) {
      query = args.join(' ');
    } else {
      return message.reply('❌ Please provide a question or reply to an image.');
    }

    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const url = `https://kaiz-apis.gleeze.com/api/claude3-haiku?ask=${encodeURIComponent(query)}&apikey=${apikey}`;
      const res = await axios.get(url);
      const responseText = res.data?.response;

      if (!responseText) throw new Error('No response from API');

      await message.reply(responseText);
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (err) {
      console.error('Claude error:', err.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      message.reply('❌ Failed to reach Claude API.');
    }
  }
};
