module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "money"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Check your balance",
    category: "economy",
    usage: "{pn}"
  },

  async onStart({ message, event, database }) {
    const userData = await database.getUser(event.senderID);
    const balance = userData.money || 0;
    return message.reply(`💰 Balance: ${balance}$`);
  }
};
