const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "delete",
    version: "1.0",
    author: "NeoKEX",
    cooldown: 5,
    role: 2,
    description: "Delete a command",
    category: "admin",
    usage: "{pn} <command name>"
  },

  async onStart({ args, message }) {
    if (!args.length) return message.reply("Please provide a command name to delete.");

    const commandName = args[0].toLowerCase();
    const commandPath = path.join(__dirname, `${commandName}.js`);

    try {
      if (!fs.existsSync(commandPath)) return message.reply(`Command "${commandName}" not found.`);
      fs.unlinkSync(commandPath);
      return message.reply(`✅ Deleted command: ${commandName}`);
    } catch (err) {
      return message.reply(`❌ Error: ${err.message}`);
    }
  }
};
