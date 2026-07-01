module.exports = {
  config: {
    name: "daily",
    version: "1.0",
    author: "NTKhang",
    cooldown: 86400,
    role: 0,
    description: "Claim your daily reward",
    category: "economy",
    usage: "{pn}"
  },

  async onStart({ message, event, database }) {
    const amount = 500;
    const userData = await database.getUser(event.senderID);
    userData.money = (userData.money || 0) + amount;
    await database.updateUser(event.senderID, userData);
    return message.reply(`🎁 You claimed your daily reward of ${amount}$!`);
  }
};
