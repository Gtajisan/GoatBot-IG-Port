
/**
 * CommandHandler.js - GoatBot-V2 Command Handler
 * Manages command registration, execution, and lifecycle
 */

class CommandHandler {
    constructor(config) {
        this.config = config;
        this.commands = new Map();
        this.aliases = new Map();
    }

    /**
     * Register a command
     */
    register(command) {
        const name = command.config.name.toLowerCase();
        this.commands.set(name, command);

        // Register aliases
        if (command.config.aliases) {
            for (const alias of command.config.aliases) {
                this.aliases.set(alias.toLowerCase(), name);
            }
        }

        console.log(`[CMD] Registered: ${name}`);
    }

    /**
     * Get command by name or alias
     */
    get(nameOrAlias) {
        const name = nameOrAlias.toLowerCase();
        if (this.commands.has(name)) {
            return this.commands.get(name);
        }
        if (this.aliases.has(name)) {
            const realName = this.aliases.get(name);
            return this.commands.get(realName);
        }
        return null;
    }

    /**
     * Get all commands
     */
    getAll() {
        return Array.from(this.commands.values());
    }

    /**
     * Reload a command
     */
    reload(commandName) {
        const command = this.get(commandName);
        if (command) {
            this.commands.delete(command.config.name.toLowerCase());
            // Remove aliases
            if (command.config.aliases) {
                for (const alias of command.config.aliases) {
                    this.aliases.delete(alias.toLowerCase());
                }
            }
        }
        return true;
    }
}

module.exports = CommandHandler;
