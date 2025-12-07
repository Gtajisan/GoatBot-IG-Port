
export default {
  config: {
    name: 'restart',
    aliases: ['reboot'],
    description: 'Restart the bot (admin only)',
    usage: '',
    cooldown: 10,
    role: 2
  },

  async run({ api }) {
    await api.sendMessage('🔄 Restarting bot...');
    
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
};
