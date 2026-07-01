const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "welcome",
    version: "1.4",
    author: "NTKhang",
    category: "events"
  },

  async run({ threadsData, api, event, bot, logger }) {
    if (event.type !== 'event' || event.eventType !== 'subscribe') return;

    const { threadID } = event;
    const addedParticipants = event.addedParticipants || [];
    if (addedParticipants.length === 0) return;

    const botID = api.getCurrentUserID();

    // Case 1: Bot added
    if (addedParticipants.some(p => p.userID == botID)) {
      const threadData = await threadsData.get(threadID);
      const prefix = threadData?.prefix || bot.config.PREFIX;
      return api.sendMessage(`Thank you for inviting me to the group!\nBot prefix: ${prefix}\nTo view the list of commands, please enter: ${prefix}help`, threadID);
    }

    // Case 2: Regular members
    const threadData = await threadsData.get(threadID);
    if (threadData?.settings?.sendWelcomeMessage === false) return;

    const hours = moment().tz(bot.config.TIMEZONE || 'UTC').hours();
    const session = hours < 10 ? "morning" : hours < 12 ? "noon" : hours < 18 ? "afternoon" : "evening";

    const isMultiple = addedParticipants.length > 1;
    const multiple = isMultiple ? "you guys" : "you";
    const threadName = threadData?.threadName || "the group";

    let welcomeMessage = threadData?.data?.welcomeMessage || "Welcome {multiple} to {boxName}! Have a great {session} 🎉";

    const namesList = addedParticipants.map(u => u.fullName || u.username || 'User').join(", ");
    const firstName = addedParticipants[0].fullName || addedParticipants[0].username || 'User';

    welcomeMessage = welcomeMessage
      .replace(/\{userName\}/g, isMultiple ? namesList : firstName)
      .replace(/\{userNameTag\}/g, isMultiple ? namesList : firstName)
      .replace(/\{multiple\}/g, multiple)
      .replace(/\{boxName\}|\{threadName\}/g, threadName)
      .replace(/\{session\}/g, session);

    return api.sendMessage(welcomeMessage, threadID);
  }
};
