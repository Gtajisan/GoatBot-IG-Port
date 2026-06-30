module.exports = {
  config: {
    name: "bot_added",
    description: "Fired when bot is added to a group"
  },
  async run({ api, event, bot, threadsData }) {
    if (event.type === 'event' && event.eventType === 'subscribe' && event.addedParticipants.some(p => p.userID == api.getCurrentUserID())) {
      const threadID = event.threadID;
      const prefix = bot.config.PREFIX;
      await api.sendMessage(`Hello! I'm ${bot.config.NICK_NAME_BOT}. Type ${prefix}help to see my commands.`, threadID);
    }
  }
};
