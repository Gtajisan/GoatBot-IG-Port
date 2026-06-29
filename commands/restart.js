module.exports = {
  config: { name: 'restart', aliases: ['reboot'], description: 'Restart the bot (Developer only)', usage: 'restart', role: 4, cooldown: 10, category: 'core' },
  async run({ api, event, logger }) {
    await api.sendMessage("🔄 Restarting bot... I'll be back in a few seconds.", event.threadId);
    logger.info(`Bot restart requested by ${event.senderID}`);
    setTimeout(() => process.exit(0), 1000);
  }
};
