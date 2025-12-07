
export default {
  config: {
    name: 'uptime',
    aliases: ['runtime'],
    description: 'Show bot uptime',
    usage: '',
    cooldown: 5,
    role: 0
  },

  async run({ api }) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return api.sendMessage(`⏰ Uptime: ${parts.join(' ')}`);
  }
};
