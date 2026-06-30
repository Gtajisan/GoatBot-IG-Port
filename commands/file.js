const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "file",
    version: "1.2",
    author: "NeoKEX",
    cooldown: 5,
    role: 4,
    description: "View the source code of a specific command",
    category: "system",
    usage: "{pn} <command name>"
  },

  async onStart({ args, message, bot }) {
    if (!args.length) return message.SyntaxError();

    const commandName = args[0].toLowerCase();
    const command = bot.commandLoader.getCommand(commandName);

    if (!command) return message.reply("❌ Command not found.");

    const actualCommandName = command.config.name;
    const filePath = path.join(__dirname, `${actualCommandName}.js`);

    try {
      if (!fs.existsSync(filePath)) return message.reply("❌ File not found.");
      const content = fs.readFileSync(filePath, "utf-8");
      if (content.length > 4000) return message.reply(`${content.substring(0, 3997)}...`);
      return message.reply(content);
    } catch (err) {
      return message.reply(`❌ Error: ${err.message}`);
    }
  }
};
