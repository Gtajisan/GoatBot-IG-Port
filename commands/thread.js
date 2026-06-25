module.exports = {
  config: { name: 'thread', aliases: ['gc', 'group'], description: 'Thread settings', usage: 'thread <info|ban|unban|prefix>', role: 2, cooldown: 3, category: 'admin' },
  async run({ api, event, args, config, database, logger }) {
    if (!args[0]) return this.showInfo(api, event, database, config);
    const action = args[0].toLowerCase();
    if (action === 'info') return this.showInfo(api, event, database, config);
    if (action === 'ban') return this.banThread(api, event, args, database, logger);
    if (action === 'unban') return this.unbanThread(api, event, args, database, logger);
    if (action === 'prefix') {
      if (!args[1]) return api.sendMessage('⚠️ Usage: thread prefix <value>', event.threadId);
      database.setThreadData(event.threadId, { prefix: args[1] }); database.save();
      return api.sendMessage(`✅ Thread prefix set to: ${args[1]}`, event.threadId);
    }
    if (action === 'resetprefix') {
      database.setThreadData(event.threadId, { prefix: null }); database.save();
      return api.sendMessage(`✅ Thread prefix reset to: ${config.PREFIX}`, event.threadId);
    }
    return api.sendMessage('🔧 thread info | ban | unban | prefix <val> | resetprefix', event.threadId);
  },
  showInfo(api, event, database, config) {
    const td = database.getThreadData(event.threadId);
    return api.sendMessage(`🗂️ Thread Info\n\nID: ${event.threadId}\nPrefix: ${td.prefix || config.PREFIX}${td.prefix ? ' (custom)' : ' (global)'}\nBanned: ${td.settings?.banned ? '🚫 Yes' : '✅ No'}`, event.threadId);
  },
  banThread(api, event, args, database, logger) {
    const id = args[1] || event.threadId;
    const td = database.getThreadData(id);
    if (td.settings?.banned) return api.sendMessage(`ℹ️ Thread ${id} already banned.`, event.threadId);
    database.setThreadData(id, { settings: { ...td.settings, banned: true } }); database.save();
    logger.info(`Thread ${id} banned by ${event.senderID}`);
    return api.sendMessage(`🚫 Thread ${id} banned.`, event.threadId);
  },
  unbanThread(api, event, args, database, logger) {
    const id = args[1];
    if (!id) return api.sendMessage('⚠️ Usage: thread unban <id>', event.threadId);
    const td = database.getThreadData(id);
    if (!td.settings?.banned) return api.sendMessage(`ℹ️ Thread ${id} not banned.`, event.threadId);
    database.setThreadData(id, { settings: { ...td.settings, banned: false } }); database.save();
    return api.sendMessage(`✅ Thread ${id} unbanned.`, event.threadId);
  }
};
