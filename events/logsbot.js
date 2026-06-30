const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "logsbot",
    version: "1.4",
    author: "NTKhang",
    category: "events"
  },

  async run({ usersData, threadsData, event, api, bot, logger }) {
    if (event.type !== 'event') return;

    const botID = api.getCurrentUserID();
    const { threadID, author } = event;
    if (author == botID) return;

    let msg = "====== Bot logs ======\n";
    let shouldSend = false;

    if (event.eventType === 'subscribe' && event.addedParticipants.some(p => p.userID == botID)) {
      const authorName = (await usersData.get(author))?.name || author;
      const threadName = (await api.getThreadInfo(threadID))?.threadName || threadID;
      msg += `\n✅\nEvent: bot has been added to a new group\n- Added by: ${authorName}`;
      msg += `\n- User ID: ${author}\n- Group: ${threadName}\n- Group ID: ${threadID}\n- Time: ${moment().tz(bot.config.TIMEZONE || 'UTC').format("DD/MM/YYYY HH:mm:ss")}`;
      shouldSend = true;
    } else if (event.eventType === 'unsubscribe' && event.leftParticipant && event.leftParticipant.userID == botID) {
      const authorName = (await usersData.get(author))?.name || author;
      const threadName = (await threadsData.get(threadID))?.threadName || threadID;
      msg += `\n❌\nEvent: bot has been kicked\n- Kicked by: ${authorName}`;
      msg += `\n- User ID: ${author}\n- Group: ${threadName}\n- Group ID: ${threadID}\n- Time: ${moment().tz(bot.config.TIMEZONE || 'UTC').format("DD/MM/YYYY HH:mm:ss")}`;
      shouldSend = true;
    }

    if (shouldSend) {
      const admins = bot.config.ADMIN_BOT || [];
      for (const adminID of admins) {
        await api.sendMessage(msg, adminID);
      }
    }
  }
};
