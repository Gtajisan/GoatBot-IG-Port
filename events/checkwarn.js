module.exports = {
  config: {
    name: "checkwarn",
    version: "1.3",
    author: "NTKhang",
    category: "events"
  },

  async run({ threadsData, api, event, bot, logger }) {
    if (event.type !== 'event' || event.eventType !== 'subscribe') return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    const warnList = threadData?.data?.warn || [];
    if (warnList.length === 0) return;

    const addedParticipants = event.addedParticipants || [];
    for (const user of addedParticipants) {
      const findUser = warnList.find(w => w.userID == user.userID);
      if (findUser && findUser.list >= 3) {
        const userName = user.fullName || user.username || 'User';
        const uid = user.userID;
        const prefix = threadData?.prefix || bot.config.PREFIX;

        const msg = `⚠️ Member ${userName} has been warned 3 times before and is banned from this chat.\n- Name: ${userName}\n- UID: ${uid}\n- To unban: ${prefix}warn unban ${uid}`;

        await api.sendMessage(msg, threadID);
        try {
          await api.removeUserFromGroup(uid, threadID);
        } catch (e) {
          await api.sendMessage("❌ Error: Bot needs administrator permissions to kick banned members.", threadID);
        }
      }
    }
  }
};
