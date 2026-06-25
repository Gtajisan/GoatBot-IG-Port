'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class ConfigManager {
  static configPath = path.resolve(__dirname, '../config/default.json');

  static loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      }
      return {};
    } catch (error) {
      logger.error('Error loading config:', { error: error.message });
      return {};
    }
  }

  static saveConfig(cfg) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(cfg, null, 2), 'utf-8');
      logger.info('Configuration saved');
      return true;
    } catch (error) {
      logger.error('Error saving config:', { error: error.message });
      return false;
    }
  }

  static getAdmins() {
    try { return (this.loadConfig().adminBot || []).map(String); } catch (_) { return []; }
  }

  static isAdmin(userId) { return this.getAdmins().includes(String(userId)); }

  static addAdmin(userId) {
    try {
      const cfg = this.loadConfig();
      if (!cfg.adminBot) cfg.adminBot = [];
      const uid = String(userId);
      if (cfg.adminBot.map(String).includes(uid)) return false;
      cfg.adminBot.push(uid);
      return this.saveConfig(cfg);
    } catch (_) { return false; }
  }

  static removeAdmin(userId) {
    try {
      const cfg = this.loadConfig();
      if (!cfg.adminBot) return false;
      const uid = String(userId);
      if (cfg.devUsers && cfg.devUsers.map(String).includes(uid)) return false;
      const idx = cfg.adminBot.map(String).indexOf(uid);
      if (idx === -1) return false;
      cfg.adminBot.splice(idx, 1);
      return this.saveConfig(cfg);
    } catch (_) { return false; }
  }

  static getPremiumUsers() {
    try { return (this.loadConfig().premiumUsers || []).map(String); } catch (_) { return []; }
  }

  static addPremiumUser(userId) {
    try {
      const cfg = this.loadConfig();
      if (!cfg.premiumUsers) cfg.premiumUsers = [];
      const uid = String(userId);
      if (cfg.premiumUsers.map(String).includes(uid)) return false;
      cfg.premiumUsers.push(uid);
      return this.saveConfig(cfg);
    } catch (_) { return false; }
  }

  static removePremiumUser(userId) {
    try {
      const cfg = this.loadConfig();
      if (!cfg.premiumUsers) return false;
      const uid = String(userId);
      const idx = cfg.premiumUsers.map(String).indexOf(uid);
      if (idx === -1) return false;
      cfg.premiumUsers.splice(idx, 1);
      return this.saveConfig(cfg);
    } catch (_) { return false; }
  }

  static getDevUsers() {
    try { return (this.loadConfig().devUsers || []).map(String); } catch (_) { return []; }
  }

  static isDev(userId) { return this.getDevUsers().includes(String(userId)); }

  static getDeveloper() {
    const devs = this.getDevUsers();
    return devs[0] || '';
  }

  static getPrefix() {
    try { return this.loadConfig().prefix || '/'; } catch (_) { return '/'; }
  }
}

module.exports = ConfigManager;
