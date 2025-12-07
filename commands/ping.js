
export default {
  config: {
    name: 'ping',
    aliases: ['latency'],
    description: 'Check bot response time',
    usage: '',
    cooldown: 3,
    role: 0
  },

  async run({ api, event }) {
    const start = Date.now();
    
    await api.sendMessage('🏓 Pong!');
    
    const ping = Date.now() - start;
    
    return api.sendMessage(`⚡ Response time: ${ping}ms`);
  }
};
