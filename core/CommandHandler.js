
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '../utils/Logger.js';
import { PermissionManager } from './PermissionManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CommandHandler {
  constructor(bot) {
    this.bot = bot;
    this.commands = new Map();
    this.cooldowns = new Map();
    this.permissionManager = new PermissionManager();
  }

  async loadCommands() {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = this.getAllFiles(commandsPath, '.js');

    for (const file of commandFiles) {
      try {
        const command = await import(file);
        const cmd = command.default || command;
        
        if (!cmd.config || !cmd.run) {
          Logger.warn(`Invalid command file: ${file}`);
          continue;
        }

        this.commands.set(cmd.config.name, cmd);
        
        // Register aliases
        if (cmd.config.aliases) {
          cmd.config.aliases.forEach(alias => {
            this.commands.set(alias, cmd);
          });
        }

        Logger.debug(`Loaded: ${cmd.config.name}`);
      } catch (error) {
        Logger.error(`Failed to load ${file}:`, error);
      }
    }
  }

  getAllFiles(dirPath, extension) {
    const files = [];
    
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        files.push(...this.getAllFiles(fullPath, extension));
      } else if (item.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async handleCommand(event) {
    const prefix = process.env.BOT_PREFIX || '/';
    const messageContent = event.body.slice(prefix.length).trim();
    const args = messageContent.split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = this.commands.get(commandName);
    
    if (!command) return;

    try {
      // Check permissions
      const hasPermission = this.permissionManager.checkPermission(
        event.senderID,
        event.threadID,
        command.config.role || 0
      );

      if (!hasPermission) {
        return this.bot.sendMessage(event.threadID, '❌ You don\'t have permission to use this command.');
      }

      // Check cooldown
      if (this.isOnCooldown(event.senderID, commandName, command.config.cooldown)) {
        return this.bot.sendMessage(event.threadID, '⏱️ Please wait before using this command again.');
      }

      // Execute command
      await command.run({
        api: this.createAPIWrapper(event.threadID),
        event,
        args,
        bot: this.bot
      });

      // Set cooldown
      this.setCooldown(event.senderID, commandName);

    } catch (error) {
      Logger.error(`Command ${commandName} error:`, error);
      await this.bot.sendMessage(event.threadID, `❌ Error: ${error.message}`);
    }
  }

  createAPIWrapper(threadID) {
    return {
      sendMessage: (message, options) => this.bot.sendMessage(threadID, message, options),
      react: (messageId, emoji) => this.bot.react(threadID, messageId, emoji),
      getUserInfo: async (userId) => {
        const userInfo = await this.bot.ig.user.info(userId);
        return {
          id: userInfo.pk,
          username: userInfo.username,
          name: userInfo.full_name,
          profilePicUrl: userInfo.profile_pic_url
        };
      }
    };
  }

  isOnCooldown(userId, commandName, cooldown = 5) {
    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Map());
    }

    const now = Date.now();
    const timestamps = this.cooldowns.get(commandName);
    const cooldownAmount = cooldown * 1000;

    if (timestamps.has(userId)) {
      const expirationTime = timestamps.get(userId) + cooldownAmount;
      if (now < expirationTime) {
        return true;
      }
    }

    return false;
  }

  setCooldown(userId, commandName) {
    const timestamps = this.cooldowns.get(commandName);
    timestamps.set(userId, Date.now());
    
    setTimeout(() => timestamps.delete(userId), (this.commands.get(commandName)?.config.cooldown || 5) * 1000);
  }
}
