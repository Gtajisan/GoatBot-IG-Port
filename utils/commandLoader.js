'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const config = require('../config');

class CommandLoader {
  constructor() {
    this.commands = new Map();
    this.cooldowns = new Map();
  }

  async loadCommands() {
    const commandsPath = path.resolve(config.COMMANDS_PATH);
    if (!fs.existsSync(commandsPath)) {
      logger.warn('Commands directory not found, creating it');
      fs.mkdirSync(commandsPath, { recursive: true });
      return;
    }

    const commandFiles = fs.readdirSync(commandsPath)
      .filter(file => file.endsWith('.js') && !file.startsWith('_') && !file.includes('.eg.'))
      .map(file => path.join(commandsPath, file));

    logger.info(`Loading ${commandFiles.length} commands...`);
    let loaded = 0;

    for (const file of commandFiles) {
      try {
        delete require.cache[require.resolve(file)];
        const commandModule = require(file);
        const cfg = commandModule.config;
        if (!cfg || !cfg.name) {
          logger.warn(`Command ${path.basename(file)} missing config.name, skipping`);
          continue;
        }

        // Normalize: support both GoatBot V2 (onStart) and InstaBOT (run) formats
        if (!commandModule.run && commandModule.onStart) {
          commandModule.run = commandModule.onStart;
          commandModule._isGoatV2 = true;
        }
        if (!commandModule.run) {
          logger.warn(`Command ${cfg.name} has no run/onStart function, skipping`);
          continue;
        }

        // Normalize config fields
        if (!cfg.cooldown && cfg.countDown) cfg.cooldown = cfg.countDown;
        if (!cfg.aliases) cfg.aliases = [];
        if (!cfg.category) cfg.category = 'others';

        this.commands.set(cfg.name.toLowerCase(), commandModule);
        for (const alias of cfg.aliases) {
          const lowerAlias = alias.toLowerCase();
          this.commands.set(lowerAlias, commandModule);
          if (global.GoatBot && global.GoatBot.aliases) {
            global.GoatBot.aliases.set(lowerAlias, cfg.name.toLowerCase());
          }
        }
        loaded++;
        logger.info(`Loaded command: ${cfg.name}${commandModule._isGoatV2 ? ' (GoatV2)' : ''}`);
      } catch (error) {
        logger.error(`Failed to load command ${path.basename(file)}`, { error: error.message });
      }
    }

    logger.info(`Successfully loaded ${loaded} commands (${this.commands.size} including aliases)`);
  }

  getCommand(commandName) {
    return this.commands.get(commandName.toLowerCase()) || null;
  }

  checkCooldown(userId, commandName, cooldownTime) {
    const key = `${userId}-${commandName}`;
    if (!this.cooldowns.has(key)) return 0;
    const expiration = this.cooldowns.get(key);
    const now = Date.now();
    if (now < expiration) return Math.ceil((expiration - now) / 1000);
    this.cooldowns.delete(key);
    return 0;
  }

  setCooldown(userId, commandName, cooldownTime) {
    const key = `${userId}-${commandName}`;
    this.cooldowns.set(key, Date.now() + cooldownTime);
    setTimeout(() => this.cooldowns.delete(key), cooldownTime);
  }

  async reloadCommands() {
    logger.info('Reloading all commands...');
    this.commands.clear();
    await this.loadCommands();
  }

  getAllCommandNames() {
    const unique = new Set();
    this.commands.forEach(cmd => { if (cmd.config?.name) unique.add(cmd.config.name); });
    return Array.from(unique);
  }
}

module.exports = CommandLoader;
