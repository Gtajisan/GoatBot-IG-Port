module.exports = {
  config: {
    name: "autoUpdateInfoThread",
    version: "1.0",
    author: "NTKhang",
    category: "events"
  },

  async run({ threadsData, api, event, bot, logger }) {
    if (event.type !== 'event') return;

    try {
      const { threadID } = event;
      if (event.eventType === 'change_thread_name') {
        await threadsData.set(threadID, { threadName: event.newThreadName });
        logger.info(`Updated thread name for ${threadID}: ${event.newThreadName}`);
      }

      // Handle addition/removal of participants to keep threadData in sync
      if (event.eventType === 'subscribe' || event.eventType === 'unsubscribe') {
        const threadInfo = await api.getThreadInfo(threadID);
        if (threadInfo) {
          await threadsData.set(threadID, {
            threadName: threadInfo.threadName,
            participants: threadInfo.participants
          });
          logger.info(`Updated participant list for ${threadID}`);
        }
      }
    } catch (e) {
      // Ignore errors for non-group events or API failures
    }
  }
};
