module.exports = {
  config: { name: 'stats', aliases: ['statistics', 'botstats'], description: 'View bot/user statistics', usage: 'stats', cooldown: 5, role: 0, category: 'info' },
  async run({ api, event, bot, logger, database, config }) {
    try {
      const user = database.getUser(event.senderID);
      const allUsers = database.getAllUsers();
      const allStats = database.getAllStats();
      const sorted = allUsers.sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));
      const rank = sorted.findIndex(u => u.id === event.senderID) + 1;
      const uptime = process.uptime();
      const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60);
      let msg = `📊 Statistics\n\n👤 Your Stats\n`;
      msg += `🆔 UID: ${event.senderID}\n📨 Messages: ${user.messageCount || 0}\n⚡ Commands: ${user.commandCount || 0}\n🏆 Rank: #${rank}/${allUsers.length}\n\n`;
      msg += `🤖 Bot Stats\n👥 Users: ${allUsers.length}\n📦 Commands: ${bot.commandLoader.getAllCommandNames().length}\n🎯 Events: ${bot.eventLoader.getAllEventNames().length}\n⏱️ Uptime: ${h}h ${m}m`;
      return api.sendMessage(msg, event.threadId);
    } catch (e) { logger.error('Error in stats', { error: e.message }); return api.sendMessage('❌ Error fetching stats.', event.threadId); }
  }
};
