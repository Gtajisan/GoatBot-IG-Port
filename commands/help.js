
export default {
  config: {
    name: 'help',
    aliases: ['h', 'commands'],
    description: 'Show all available commands',
    usage: '[command_name]',
    cooldown: 3,
    role: 0
  },

  async run({ api, event, args, bot }) {
    const { commands } = bot.commandHandler;
    
    if (args.length === 0) {
      const commandList = Array.from(commands.values())
        .filter((cmd, index, self) => 
          self.findIndex(c => c.config.name === cmd.config.name) === index
        )
        .map(cmd => `/${cmd.config.name}`)
        .join(', ');

      return api.sendMessage(
        `📚 Available Commands (${commands.size})\n\n${commandList}\n\nUse /help [command] for details`
      );
    }

    const commandName = args[0].toLowerCase();
    const command = commands.get(commandName);

    if (!command) {
      return api.sendMessage('❌ Command not found');
    }

    const info = `
📖 Command: /${command.config.name}
${command.config.description}

Usage: /${command.config.name} ${command.config.usage || ''}
Aliases: ${command.config.aliases?.join(', ') || 'None'}
Cooldown: ${command.config.cooldown || 5}s
Permission: ${['Everyone', 'Group Admin', 'Bot Admin'][command.config.role || 0]}
    `.trim();

    return api.sendMessage(info);
  }
};
