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
        logger.info('Instagram-FCA login successful');
    } catch (e) {
        logger.error('Instagram-FCA login failed', { error: e.message });
        logger.info('Attempting login with nkxica (Fallback)...');
        try {
            this.nkxica = await loginNkxica(credentials);
            logger.info('nkxica login successful');
        } catch (nkErr) {
            logger.error('nkxica login failed', { error: nkErr.message });
            throw e;
        }
    }

    if (config.EXPERIMENTAL_FCA_ENABLE && !this.nkxica) {
        try {
            logger.info('Logging in with nkxica (Secondary)...');
            this.nkxica = await loginNkxica(credentials);
            logger.info('nkxica login successful');
        } catch (e) {
            logger.warn('nkxica login failed, continuing with Instagram-FCA only.');
        }
    }

    this._afterLogin();
  }

  _afterLogin() {
    const primary = this.fca || this.nkxica;
    if (!primary) throw new Error('No API instance available after login.');

    try {
      this.userID = String(primary.getCurrentUserID ? primary.getCurrentUserID() : (primary.userID || primary.id || 'unknown'));
      this.username = primary.currentUsername || this.userID;
    } catch (e) {
      this.userID = 'unknown';
      this.username = 'unknown';
    }

    const nkxicaWrapper = this.nkxica ? this.createNkxicaWrapper() : null;

    this.api = this.fca || nkxicaWrapper;

    if (this.fca && nkxicaWrapper) {
        this.api = createDualFca(this.fca, nkxicaWrapper);
    }

    global.GoatBot.fcaApi = this.api;
    global.api = this.api;

    this.api.listen((err, event) => {
        if (err) {
            logger.error('Listen error', { error: err.message });
            // If the listener has a fatal error, we schedule a reconnect
            if (this.isRunning && this.shouldReconnect) {
                logger.warn('Fatal listen error detected. Restarting bot...');
                this.isRunning = false;
                this.scheduleReconnect();
            }
            return;
        }
        if (!event) return;

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
      const normalized = { ...event };
      if (normalized.thread_id) normalized.threadID = String(normalized.thread_id);
      if (normalized.threadID) normalized.threadID = String(normalized.threadID);

      if (normalized.user_id) normalized.senderID = String(normalized.user_id);
      if (normalized.senderID) normalized.senderID = String(normalized.senderID);

      if (normalized.item_id) normalized.messageID = String(normalized.item_id);
      if (normalized.messageID) normalized.messageID = String(normalized.messageID);

      normalized.threadId = normalized.threadID;

      return normalized;
  }

  createNkxicaWrapper() {
    const ig = this.nkxica;
    const self = this;

    const wrapper = {
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
      getUserInfo: async (id) => {
          if (typeof ig.getUserInfo === 'function') return await ig.getUserInfo(id);
          return {};
      },
      unsendMessage: async (id) => {
          if (typeof ig.unsendMessage === 'function') return await ig.unsendMessage(id);
      },
      setMessageReaction: async (emoji, id) => {
          if (typeof ig.sendReaction === 'function') return await ig.sendReaction(emoji, id);
          if (typeof ig.setMessageReaction === 'function') return await ig.setMessageReaction(emoji, id);
      },
      markAsRead: async (threadID) => {
          if (typeof ig.markAsRead === 'function') return await ig.markAsRead(threadID);
      },
      listen: (callback) => {
          if (typeof ig.listen === 'function') return ig.listen(callback);
      },
      getCurrentUserID: () => {
          if (typeof ig.getCurrentUserID === 'function') return ig.getCurrentUserID();
          return ig.userID || ig.id || 'unknown';
      }
    };

    return new Proxy(ig, {
        get(target, prop) {
            if (prop in wrapper) return wrapper[prop];
            const value = target[prop];
            if (typeof value === 'function') return value.bind(target);
            return value;
        }
    });
  }

  startHealthServer() {
      const port = parseInt(process.env.PORT || config.DASHBOARD_PORT || 3000, 10);
      const server = http.createServer((req, res) => {
          const url = new URL(req.url, `http://${req.headers.host}`);
          if (url.pathname === '/uptime') {
              res.writeHead(200);
              res.end('OK');
              return;
          }
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
      if (config.AUTO_UPTIME_ENABLE) {
          const axios = require('axios');
          const uptimeUrl = process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/uptime` : config.AUTO_UPTIME_URL;

          if (!uptimeUrl) return;

          setInterval(async () => {
              try {
                  await axios.get(uptimeUrl);
              } catch (e) {
                  // ignore
              }
          }, (config.AUTO_UPTIME_INTERVAL || 180) * 1000);

          logger.info(`Auto-uptime enabled for: ${uptimeUrl}`);
      }
  }
}

module.exports = InstagramBot;
