module.exports = {
  config: {
    name: "setalias",
    aliases: ["alias"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 1,
    description: "Set alias for a command",
    category: "config",
    usage: "{pn} <command> <alias>"
  },

  async onStart({ message, args, bot }) {
    const cmdName = args[0]?.toLowerCase();
    const alias = args[1]?.toLowerCase();
    if (!cmdName || !alias) return message.reply("❌ Usage: setalias <command> <alias>");

    const command = bot.commandLoader.getCommand(cmdName);
    if (!command) return message.reply("❌ Command not found.");

    if (!command.config.aliases) command.config.aliases = [];
    command.config.aliases.push(alias);

    // Note: This only lasts until restart unless we persist it.
    // For V2 parity, we'd need to save this to a global config or DB.
    return message.reply(`✅ Set alias "${alias}" for command "${cmdName}".`);
  }
};
