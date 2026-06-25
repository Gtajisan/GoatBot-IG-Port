module.exports = {
  config: { name: 'time', aliases: ['date', 'clock'], description: 'Show current time and date', usage: 'time', cooldown: 3, role: 0, category: 'utility' },
  async run({ api, event, config, logger }) {
    const now = new Date().toLocaleString('en-US', { timeZone: config.TIMEZONE || 'UTC', dateStyle: 'full', timeStyle: 'long' });
    return api.sendMessage(`🕐 Current time:\n${now}`, event.threadId);
  }
};
