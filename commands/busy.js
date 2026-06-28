module.exports = {
  config: {
    name: "busy",
    version: "1.6",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Turn on do not disturb mode, when you are tagged bot will notify",
    category: "utility"
  },

  async onStart({ args, message, event, usersData }) {
    const { senderID } = event;

    if (args[0] == "off") {
      const userData = await usersData.get(senderID);
      if (userData.data) delete userData.data.busy;
      await usersData.set(senderID, userData);
      return message.reply("✓ | Do not disturb mode has been turned off");
    }

    const reason = args.join(" ") || "No reason";
    const userData = await usersData.get(senderID);
    if (!userData.data) userData.data = {};
    userData.data.busy = reason;
    await usersData.set(senderID, userData);

    return message.reply(`✓ | Do not disturb mode has been turned on with reason: ${reason}`);
  },

  async onChat({ event, message, usersData }) {
    const { mentions } = event;
    if (!mentions || Object.keys(mentions).length == 0) return;

    for (const userID in mentions) {
      const userData = await usersData.get(userID);
      if (userData && userData.data && userData.data.busy) {
        return message.reply(`Current user ${mentions[userID].replace("@", "")} is busy: ${userData.data.busy}`);
      }
    }
  }
};
