module.exports = {
  config: {
    name: "leave",
    version: "1.0",
    author: "NTKhang",
    category: "events"
  },

  async run({ threadsData, api, event, bot, logger }) {
    if (event.type !== 'event' || event.eventType !== 'unsubscribe') return;

    const { threadID } = event;
    const leftParticipant = event.leftParticipant;
    if (!leftParticipant) return;

    const botID = api.getCurrentUserID();

    // If bot is kicked, nothing to say
    if (leftParticipant.userID == botID) return;

    const threadData = await threadsData.get(threadID);
    if (threadData?.settings?.sendLeaveMessage === false) return;

    const threadName = threadData?.threadName || "the group";
    let leaveMessage = threadData?.data?.leaveMessage || "{userName} has left {boxName}. Goodbye! 👋";

    const userName = leftParticipant.fullName || leftParticipant.username || 'User';

    leaveMessage = leaveMessage
      .replace(/\{userName\}/g, userName)
      .replace(/\{boxName\}|\{threadName\}/g, threadName);

    return api.sendMessage(leaveMessage, threadID);
  }
};
