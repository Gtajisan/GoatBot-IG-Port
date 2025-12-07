
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class Handler {
    constructor() {
        this.commands = new Map();
        this.events = new Map();
        this.cooldowns = new Map();
    }
    
    async initialize(api, config) {
        this.api = api;
        this.config = config;
        
        // Load commands
        await this.loadCommands();
        
        // Load events
        await this.loadEvents();
        
        // Start listening
        this.startListening();
        
        logger.success(`Loaded ${this.commands.size} commands and ${this.events.size} events`);
    }
    
    async loadCommands() {
        const commandsPath = path.join(__dirname, '../commands');
        await fs.ensureDir(commandsPath);
        
        const files = await fs.readdir(commandsPath);
        
        for (const file of files) {
            if (!file.endsWith('.js')) continue;
            
            try {
                const command = require(path.join(commandsPath, file));
                
                if (!command.config || !command.config.name) {
                    logger.warn(`Command ${file} is missing config.name`);
                    continue;
                }
                
                this.commands.set(command.config.name.toLowerCase(), command);
                
                if (command.config.aliases) {
                    for (const alias of command.config.aliases) {
                        this.commands.set(alias.toLowerCase(), command);
                    }
                }
                
            } catch (error) {
                logger.error(`Error loading command ${file}:`, error);
            }
        }
    }
    
    async loadEvents() {
        const eventsPath = path.join(__dirname, '../events');
        await fs.ensureDir(eventsPath);
        
        const files = await fs.readdir(eventsPath);
        
        for (const file of files) {
            if (!file.endsWith('.js')) continue;
            
            try {
                const event = require(path.join(eventsPath, file));
                
                if (!event.config || !event.config.name) {
                    logger.warn(`Event ${file} is missing config.name`);
                    continue;
                }
                
                this.events.set(event.config.name, event);
                
            } catch (error) {
                logger.error(`Error loading event ${file}:`, error);
            }
        }
    }
    
    startListening() {
        this.api.listen((err, message) => {
            if (err) {
                logger.error('Listen error:', err);
                return;
            }
            
            this.handleMessage(message);
        });
    }
    
    async handleMessage(message) {
        try {
            // Trigger message events
            for (const [name, event] of this.events) {
                if (event.config.type === 'message') {
                    try {
                        await event.run({ api: this.api, message, config: this.config });
                    } catch (error) {
                        logger.error(`Error in event ${name}:`, error);
                    }
                }
            }
            
            // Check if message starts with prefix
            if (!message.body || !message.body.startsWith(this.config.prefix)) {
                return;
            }
            
            // Parse command
            const args = message.body.slice(this.config.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            
            const command = this.commands.get(commandName);
            
            if (!command) return;
            
            // Check permissions
            if (command.config.role && command.config.role > 0) {
                if (!this.config.adminUIDs.includes(message.senderID)) {
                    await this.api.sendMessage(message.threadID, '❌ You do not have permission to use this command.');
                    return;
                }
            }
            
            // Check cooldown
            if (this.checkCooldown(message.senderID, commandName, command.config.cooldown || 5)) {
                const remaining = this.getCooldownRemaining(message.senderID, commandName);
                await this.api.sendMessage(message.threadID, `⏱️ Please wait ${remaining}s before using this command again.`);
                return;
            }
            
            // Execute command
            try {
                await command.run({ api: this.api, message, args, config: this.config });
            } catch (error) {
                logger.error(`Error executing command ${commandName}:`, error);
                await this.api.sendMessage(message.threadID, `❌ Error: ${error.message}`);
            }
            
        } catch (error) {
            logger.error('Error handling message:', error);
        }
    }
    
    checkCooldown(userId, commandName, cooldownTime) {
        const key = `${userId}_${commandName}`;
        
        if (!this.cooldowns.has(key)) {
            this.cooldowns.set(key, Date.now());
            return false;
        }
        
        const lastUsed = this.cooldowns.get(key);
        const timePassed = (Date.now() - lastUsed) / 1000;
        
        if (timePassed < cooldownTime) {
            return true;
        }
        
        this.cooldowns.set(key, Date.now());
        return false;
    }
    
    getCooldownRemaining(userId, commandName) {
        const key = `${userId}_${commandName}`;
        const lastUsed = this.cooldowns.get(key);
        const command = this.commands.get(commandName);
        const cooldownTime = command?.config?.cooldown || 5;
        
        return Math.ceil(cooldownTime - (Date.now() - lastUsed) / 1000);
    }
}

module.exports = new Handler();
