const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "time",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Check current time in various zones",
    category: "info",
    usage: "{pn} [timezone]"
  },

  async onStart({ message, args, bot }) {
    const tz = args[0] || bot.config.TIMEZONE || "Asia/Dhaka";
    try {
      const time = moment().tz(tz).format("LLLL");
      return message.reply(`🕒 Current time in ${tz}:\n${time}`);
    } catch (e) {
      return message.reply("❌ Invalid timezone.");
    }
  }
};
