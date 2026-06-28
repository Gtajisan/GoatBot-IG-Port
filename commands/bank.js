const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

const BANK_NAME = "GOAT BANK";
const CURRENCY_SYMBOL = "$";

module.exports = {
  config: {
    name: "bank",
    aliases: ["atm"],
    version: "2.0",
    author: "Neoaz",
    cooldown: 5,
    role: 0,
    description: "Banking system",
    category: "economy"
  },

  async onStart({ args, message, event, usersData, database }) {
    const { senderID } = event;
    let userData = await usersData.get(senderID);
    if (!userData.data) userData.data = {};
    if (!userData.data.bank) {
        userData.data.bank = { balance: 0, transactions: [] };
    }

    const action = args[0]?.toLowerCase();

    if (!action) {
      return message.reply(`🏦 ${BANK_NAME}\n• bank register\n• bank balance\n• bank deposit <amt>\n• bank withdraw <amt>`);
    }

    switch (action) {
      case "register":
        message.reply("✅ Bank account activated!");
        break;

      case "balance":
      case "bal":
        message.reply(`💳 ${BANK_NAME}\nOwner: ${userData.name}\nBalance: ${CURRENCY_SYMBOL}${userData.data.bank.balance.toLocaleString()}`);
        break;

      case "deposit":
      case "dep":
        const depAmt = parseInt(args[1]);
        if (isNaN(depAmt) || depAmt <= 0) return message.reply("Invalid amount.");
        if ((userData.money || 0) < depAmt) return message.reply("Insufficient wallet funds.");

        userData.money -= depAmt;
        userData.data.bank.balance += depAmt;
        await usersData.set(senderID, userData);
        database.updateUser(senderID, { money: userData.money });
        message.reply(`✅ Deposited ${CURRENCY_SYMBOL}${depAmt.toLocaleString()}`);
        break;

      case "withdraw":
      case "wd":
        const wdAmt = parseInt(args[1]);
        if (isNaN(wdAmt) || wdAmt <= 0) return message.reply("Invalid amount.");
        if (userData.data.bank.balance < wdAmt) return message.reply("Insufficient bank balance.");

        userData.data.bank.balance -= wdAmt;
        userData.money = (userData.money || 0) + wdAmt;
        await usersData.set(senderID, userData);
        database.updateUser(senderID, { money: userData.money });
        message.reply(`✅ Withdrew ${CURRENCY_SYMBOL}${wdAmt.toLocaleString()}`);
        break;
    }
  }
};
