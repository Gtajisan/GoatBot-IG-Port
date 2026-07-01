module.exports = {
  config: {
    name: "bank",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Banking system",
    category: "economy",
    usage: "{pn} deposit <amount> | {pn} withdraw <amount>"
  },

  async onStart({ message, event, args, database }) {
    const action = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);
    const userData = await database.getUser(event.senderID);
    if (!userData.bank) userData.bank = 0;

    if (action === "deposit") {
      if (isNaN(amount) || amount <= 0 || (userData.money || 0) < amount) return message.reply("❌ Invalid amount.");
      userData.money -= amount;
      userData.bank += amount;
      await database.updateUser(event.senderID, userData);
      return message.reply(`✅ Deposited ${amount}$ to your bank.`);
    } else if (action === "withdraw") {
      if (isNaN(amount) || amount <= 0 || userData.bank < amount) return message.reply("❌ Invalid amount.");
      userData.bank -= amount;
      userData.money = (userData.money || 0) + amount;
      await database.updateUser(event.senderID, userData);
      return message.reply(`✅ Withdrew ${amount}$ from your bank.`);
    }

    return message.reply(`🏦 BANK\n- Cash: ${userData.money || 0}$\n- Bank: ${userData.bank}$\n\nUsage: bank deposit/withdraw <amount>`);
  }
};
