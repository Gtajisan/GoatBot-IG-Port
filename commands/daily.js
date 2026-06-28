const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "daily",
    cooldown: 5,
    role: 0,
    description: "Receive daily gift",
    category: "economy"
  },

  async onStart({ args, message, event, usersData, database, config }) {
    const reward = { coin: 500, exp: 50 };
    const tz = config.TIMEZONE || "Asia/Dhaka";
    const dateTime = moment.tz(tz).format("DD/MM/YYYY");
    const { senderID } = event;

    const userData = await usersData.get(senderID);
    if (!userData.data) userData.data = {};

    if (userData.data.lastTimeGetReward === dateTime) {
      return message.reply("You have already received your daily gift today!");
    }

    const getCoin = reward.coin;
    const getExp = reward.exp;

    userData.data.lastTimeGetReward = dateTime;
    await usersData.set(senderID, {
      money: (userData.money || 0) + getCoin,
      exp: (userData.exp || 0) + getExp,
      data: userData.data
    });

    // Sync to main economy if applicable
    database.addBalance(senderID, getCoin);

    message.reply(`🎁 You have received ${getCoin.toLocaleString()} coins and ${getExp} EXP!`);
  }
};
