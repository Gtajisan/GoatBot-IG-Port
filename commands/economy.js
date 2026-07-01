module.exports = {
  config: {
    name: "economy",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "View top richest users",
    category: "economy",
    usage: "{pn} top"
  },

  async onStart({ message, database }) {
    const allUsers = await database.getAllUsers();
    allUsers.sort((a, b) => (b.money || 0) - (a.money || 0));

    let msg = "💰 TOP RICH USERS:\n";
    for (let i = 0; i < Math.min(allUsers.length, 10); i++) {
      msg += `${i + 1}. ${allUsers[i].name || allUsers[i].userID}: ${allUsers[i].money || 0}$\n`;
    }
    return message.reply(msg);
  }
};
