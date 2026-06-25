const axios = require('axios');

module.exports = {
  config: { name: 'ai', aliases: ['gpt', 'ask', 'chatgpt'], description: 'Ask AI anything', usage: 'ai <question>', cooldown: 10, role: 0, category: 'ai' },
  async run({ api, event, args, logger }) {
    try {
      if (args.length === 0) return api.sendMessage('❌ Usage: ai <question>\nExample: ai What is JavaScript?', event.threadId);
      const question = args.join(' ');
      if (!process.env.OPENAI_API_KEY) {
        return api.sendMessage('❌ AI feature requires an OpenAI API key. Contact the bot admin.', event.threadId);
      }
      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: 'You are a helpful assistant. Keep responses concise.' }, { role: 'user', content: question }],
        max_tokens: 500, temperature: 0.7
      }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 30000 });
      return api.sendMessage(`🤖 AI Response:\n\n${res.data.choices[0].message.content}`, event.threadId);
    } catch (e) {
      logger.error('Error in ai', { error: e.message });
      if (e.response?.status === 429) return api.sendMessage('❌ Rate limit exceeded. Try again later.', event.threadId);
      return api.sendMessage(`❌ AI error: ${e.message}`, event.threadId);
    }
  }
};
