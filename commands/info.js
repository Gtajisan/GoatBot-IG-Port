
import os from 'os';

export default {
  config: {
    name: 'info',
    aliases: ['botinfo', 'about'],
    description: 'Show bot information',
    usage: '',
    cooldown: 5,
    role: 0
  },

  async run({ api, bot }) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const info = `
🤖 Instagram GoatBot v1.0

📊 Statistics:
• Uptime: ${hours}h ${minutes}m ${seconds}s
• Commands: ${bot.commandHandler.commands.size}
• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• Platform: ${os.platform()}
• Node.js: ${process.version}

⚙️ Prefix: ${process.env.BOT_PREFIX || '/'}
    `.trim();

    return api.sendMessage(info);
  }
};
