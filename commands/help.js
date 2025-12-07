
module.exports = {
    config: {
        name: 'help',
        aliases: ['commands', 'cmd'],
        description: 'Show all available commands',
        usage: '[command name]',
        cooldown: 5,
        role: 0
    },
    
    async run({ api, message, args, config }) {
        const handler = require('../core/handler');
        
        if (args.length === 0) {
            // Show all commands
            let helpText = '📚 Available Commands:\n\n';
            
            const commandList = [];
            for (const [name, cmd] of handler.commands) {
                if (!commandList.find(c => c.config.name === cmd.config.name)) {
                    commandList.push(cmd);
                }
            }
            
            for (const cmd of commandList) {
                helpText += `${config.prefix}${cmd.config.name}`;
                if (cmd.config.aliases && cmd.config.aliases.length > 0) {
                    helpText += ` (${cmd.config.aliases.join(', ')})`;
                }
                helpText += `\n  └ ${cmd.config.description || 'No description'}\n`;
            }
            
            helpText += `\nUse ${config.prefix}help [command] for detailed info`;
            
            await api.sendMessage(message.threadID, helpText);
            
        } else {
            // Show specific command
            const commandName = args[0].toLowerCase();
            const command = handler.commands.get(commandName);
            
            if (!command) {
                await api.sendMessage(message.threadID, `❌ Command "${commandName}" not found.`);
                return;
            }
            
            let cmdInfo = `📖 Command: ${command.config.name}\n\n`;
            cmdInfo += `Description: ${command.config.description || 'No description'}\n`;
            cmdInfo += `Usage: ${config.prefix}${command.config.name} ${command.config.usage || ''}\n`;
            cmdInfo += `Cooldown: ${command.config.cooldown || 5}s\n`;
            cmdInfo += `Permission: ${command.config.role === 0 ? 'Everyone' : 'Admin'}\n`;
            
            if (command.config.aliases && command.config.aliases.length > 0) {
                cmdInfo += `Aliases: ${command.config.aliases.join(', ')}\n`;
            }
            
            await api.sendMessage(message.threadID, cmdInfo);
        }
    }
};
