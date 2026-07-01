'use strict';

const { login } = require('@neoaz07/nkxica');
const loginFca = require('./instagram-fca/login-wrapper');
const createDualFca = require('./DualFca');

const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const cron = require('node-cron');
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const CommandLoader = require('../utils/commandLoader');
const EventLoader   = require('../utils/eventLoader');
const Banner        = require('../utils/banner');

class InstagramBot {
  constructor() {
    this.ig = null;
    this.experimentalFca = null;
    this.api = null;
    this.userID = null;
    this.username = null;
    this.commandLoader = new CommandLoader();
    this.eventLoader = new EventLoader(this);
    this.reconnectAttempts = 0;
    this.shouldReconnect = config.AUTO_RECONNECT;
    this.isRunning = false;

    // Initialize global GoatBot structure for V2 compatibility
    global.GoatBot = {
        config: config,
        commands: this.commandLoader.commands,
        aliases: new Map(), // Populated by CommandLoader
        onReply: new Map(),
        onReaction: new Map(),
        onEvent: [],
        logger: logger,
        instance: this
    };

    global.utils = require('../utils.js');
    global.api = null; // Will be set after login
  }

  async start() {
    this.startHealthServer();
    this.keepAlive();

    try {
      await this.commandLoader.loadAll();
      await this.eventLoader.loadAll();

      const database = require('../utils/database');
      await database.ready;

      await this.loadAndLogin();

      this._scheduleAutoRestart();
      this._scheduleAutoUptime();
      this.isRunning = true;

      // Trigger ready event
      this.eventLoader.handleEvent('ready', this);

    } catch (error) {
      logger.error('Failed to start bot', { error: error.message, stack: error.stack });
      if (this.shouldReconnect && this.reconnectAttempts < config.MAX_RECONNECT_ATTEMPTS) {
        this.scheduleReconnect();
      } else {
        process.exit(1);
      }
    }
  }

  async loadAndLogin() {
    const hasCookieFile   = fs.existsSync(config.ACCOUNT_FILE);
    const cookieContent   = hasCookieFile ? fs.readFileSync(config.ACCOUNT_FILE, 'utf-8') : '';

    if (!cookieContent) throw new Error('No cookies found in account.txt');

    logger.info('Logging in with nkxica (Primary)...');
    this.ig = await login(cookieContent);

    if (config.EXPERIMENTAL_FCA_ENABLE) {
        try {
            logger.info('Logging in with Instagram-FCA (Experimental)...');
            this.experimentalFca = await loginFca(cookieContent);
        } catch (e) {
            logger.warn('Instagram-FCA login failed, continuing with nkxica only.');
        }
    }

    this._afterLogin();
  }

  _afterLogin() {
    try {
      const idResult = this.ig.getCurrentUserID();
      this.userID = typeof idResult === 'object'
        ? (idResult.userID || idResult.userId || String(idResult))
        : String(idResult);
    } catch (e) {
      this.userID = 'unknown';
    }

    this.username = this.userID;

    // Create the dual-path API wrapper
    const nkxicaWrapper = this.createAPIWrapper();
    this.api = createDualFca(nkxicaWrapper, this.experimentalFca);

    global.GoatBot.fcaApi = this.api;
    global.api = this.api;

    // Load commands onLoad
    const database = require('../utils/database');
    for (const [name, cmd] of this.commandLoader.commands) {
        if (typeof cmd.onLoad === 'function') {
            try {
                cmd.onLoad({
                    api: this.api,
                    bot: this,
                    database,
                    usersData: database.usersData,
                    threadsData: database.threadsData
                });
            } catch (e) {
                logger.error(`Error in onLoad of ${name}`, { error: e.message });
            }
        }
    }
  }

  createAPIWrapper() {
    const ig = this.ig;
    return {
      sendMessage: async (form, threadID, callback, replyToMessageID) => {
          return await ig.sendMessage(form, threadID, callback, replyToMessageID);
      },
      getUserInfo: async (id) => await ig.getUserInfo(id),
      getUserInfoByUsername: async (username) => await ig.getUserInfoByUsername(username),
      getThreadInfo: async (id) => await ig.getThreadInfo(id),
      getThreadList: async (limit, folder) => await ig.getThreadList(limit, folder),
      getCurrentUserID: () => this.userID,
      unsendMessage: async (id) => await ig.unsendMessage(id),
      setMessageReaction: async (emoji, id) => await ig.sendReaction(emoji, id),
      changeNickname: async (name, threadID, userID) => {
          if (typeof ig.changeNickname === 'function') return await ig.changeNickname(name, threadID, userID);
          return true;
      }
    };
  }

  startHealthServer() {
      const port = parseInt(process.env.PORT || config.DASHBOARD_PORT || 3000, 10);
      const server = http.createServer((req, res) => {
          res.writeHead(200);
          res.end('Bot is running');
      });
      server.on('error', (e) => {
          if (e.code === 'EADDRINUSE') {
              logger.warn(`Port ${port} in use, health server not started.`);
          }
      });
      server.listen(port);
  }

  scheduleReconnect() {
      this.reconnectAttempts++;
      setTimeout(() => this.start(), 5000);
  }

  keepAlive() {
      process.on('SIGINT', () => process.exit(0));
      process.on('SIGTERM', () => process.exit(0));
  }
}

module.exports = InstagramBot;
