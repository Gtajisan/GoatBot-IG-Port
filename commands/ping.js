
module.exports = {
    config: {
        name: 'ping',
        aliases: ['pong'],
        description: 'Check bot response time',
        usage: '',
        cooldown: 3,
        role: 0
    },
    
    async run({ api, message }) {
        const start = Date.now();
        
        await api.sendMessage(message.threadID, '🏓 Pinging...').then(async () => {
            const ping = Date.now() - start;
            await api.sendMessage(message.threadID, `✅ Pong! Response time: ${ping}ms`);
        });
    }
};
