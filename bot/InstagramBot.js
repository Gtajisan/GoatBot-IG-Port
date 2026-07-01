'use strict';

const loginNkxica = require('@neoaz07/nkxica').login;
const loginFca = require('./instagram-fca/login-wrapper');
const createDualFca = require('./DualFca');

const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const config = require('../config');
const logger = require('../utils/logger');
const CommandLoader = require('../utils/commandLoader');
const EventLoader   = require('../utils/eventLoader');

class InstagramBot {
  constructor() {
    this.fca = null;
    this.nkxica = null;
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
        aliases: this.commandLoader.aliases,
        onReply: new Map(),
        onReaction: new Map(),
        onEvent: [],
        logger: logger,
        instance: this
    };

    global.utils = require('../utils.js');
    global.api = null;
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
    let credentials = config.ACCOUNT_COOKIES;

    if (!credentials && fs.existsSync(config.ACCOUNT_FILE)) {
        credentials = fs.readFileSync(config.ACCOUNT_FILE, 'utf-8');
    }

    if (!credentials && config.ACCOUNT_EMAIL && config.ACCOUNT_PASSWORD) {
        credentials = {
            email: config.ACCOUNT_EMAIL,
            password: config.ACCOUNT_PASSWORD,
            twoFactorSecret: config.ACCOUNT_2FA_SECRET
        };
    }

    if (!credentials) {
        throw new Error('No credentials found. Please provide IG_COOKIES or set up account.txt / EMAIL & PASSWORD.');
    }

    logger.info('Logging in with Instagram-FCA (Primary)...');
    try {
        this.fca = await loginFca(credentials, config.OPTIONS_FCA);
    } catch (e) {
        logger.error('Instagram-FCA login failed', { error: e.message });
        throw e;
    }

    if (config.EXPERIMENTAL_FCA_ENABLE) {
        try {
            logger.info('Logging in with nkxica (Fallback)...');
            this.nkxica = await loginNkxica(credentials);
        } catch (e) {
            logger.warn('nkxica login failed, continuing with Instagram-FCA only.');
        }
    }

    this._afterLogin();
  }

  _afterLogin() {
    try {
      this.userID = String(this.fca.getCurrentUserID());
      this.username = this.fca.currentUsername || this.userID;
    } catch (e) {
      this.userID = 'unknown';
      this.username = 'unknown';
    }

    const nkxicaWrapper = this.nkxica ? this.createNkxicaWrapper() : null;
    // For now, we use FCA as primary directly or through DualFca if nkxica is enabled
    // If nkxica is fallback, we swap the order in DualFca or just use FCA
    this.api = this.fca;

    if (nkxicaWrapper) {
        // If we wanted to use DualFca with FCA as primary:
        // this.api = createDualFca(this.fca, nkxicaWrapper);
        // But DualFca was designed with nkxica as target and fca as fallback.
        // Let's keep it simple for now and use FCA as primary.
    }

    global.GoatBot.fcaApi = this.api;
    global.api = this.api;

    // Start listening
    this.api.listen((err, event) => {
        if (err) return logger.error('Listen error', { error: err.message });
        if (!event) return;

        // Normalize event for GoatBot
        const normalizedEvent = this.normalizeEvent(event);
        this.eventLoader.handleEvent(normalizedEvent.type, normalizedEvent);
    });

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

  normalizeEvent(event) {
      // Ensure threadID and senderID are present and strings
      const normalized = { ...event };
      if (normalized.thread_id) normalized.threadID = String(normalized.thread_id);
      if (normalized.threadID) normalized.threadID = String(normalized.threadID);

      if (normalized.user_id) normalized.senderID = String(normalized.user_id);
      if (normalized.senderID) normalized.senderID = String(normalized.senderID);

      if (normalized.item_id) normalized.messageID = String(normalized.item_id);
      if (normalized.messageID) normalized.messageID = String(normalized.messageID);

      // Map GoatBot specific fields if needed
      normalized.threadId = normalized.threadID;

      return normalized;
  }

  createNkxicaWrapper() {
    const ig = this.nkxica;
    const self = this;

    return {
      sendMessage: async (form, threadID, callback, replyToMessageID) => {
          let finalForm = form;
          if (typeof form === 'string') finalForm = { body: form };
          try {
              const res = await ig.sendMessage(finalForm, threadID, null, replyToMessageID);
              if (callback) callback(null, res);
              return res;
          } catch (e) {
              if (callback) callback(e);
              throw e;
          }
      },
      getUserInfo: async (id) => await ig.getUserInfo(id),
      unsendMessage: async (id) => await ig.unsendMessage(id),
      setMessageReaction: async (emoji, id) => await ig.sendReaction(emoji, id),
      markAsRead: async (threadID) => await ig.markAsRead(threadID)
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
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      logger.info(`Scheduling reconnect in ${delay/1000}s...`);
      setTimeout(() => this.start(), delay);
  }

  keepAlive() {
      process.on('SIGINT', () => process.exit(0));
      process.on('SIGTERM', () => process.exit(0));
  }

  _scheduleAutoRestart() {
      if (config.AUTO_RESTART_TIME) {
          const cron = require('node-cron');
          cron.schedule(config.AUTO_RESTART_TIME, () => {
              logger.info('Auto-restarting bot...');
              process.exit(1);
          });
      }
  }

  _scheduleAutoUptime() {
      if (config.AUTO_UPTIME_ENABLE && config.AUTO_UPTIME_URL) {
          const axios = require('axios');
          setInterval(async () => {
              try {
                  await axios.get(config.AUTO_UPTIME_URL);
              } catch (e) {
                  // ignore
              }
          }, config.AUTO_UPTIME_INTERVAL * 1000);
      }
  }
}

module.exports = InstagramBot;
