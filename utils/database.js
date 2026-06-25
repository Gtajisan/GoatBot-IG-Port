'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const config = require('../config');

class Database {
  constructor() {
    this.data = this.createDefaultData();
    this.dbPath = path.resolve(config.DATABASE_PATH);
    this.sqlite = null;
    this.storeType = 'json';
    this.ready = this.init();
  }

  createDefaultData() {
    return {
      users: {},
      threads: {},
      stats: {},
      economy: {},
      reminders: [],
      autoResponses: [],
      welcomedUsers: new Set(),
      bannedUsers: new Set(),
      bannedUsersExpiry: {},
      spamWarnings: {},
      lastMessages: {},
      sentMessages: {},
      processedMessages: {}
    };
  }

  normalizeData(parsed = {}) {
    return {
      users: parsed.users || {},
      threads: parsed.threads || {},
      stats: parsed.stats || {},
      economy: parsed.economy || {},
      reminders: parsed.reminders || [],
      autoResponses: parsed.autoResponses || [],
      welcomedUsers: new Set(parsed.welcomedUsers || []),
      bannedUsers: new Set(parsed.bannedUsers || []),
      bannedUsersExpiry: parsed.bannedUsersExpiry || {},
      spamWarnings: parsed.spamWarnings || {},
      lastMessages: parsed.lastMessages || {},
      sentMessages: parsed.sentMessages || {},
      processedMessages: parsed.processedMessages || {}
    };
  }

  serializeData() {
    return {
      ...this.data,
      welcomedUsers: Array.from(this.data.welcomedUsers),
      bannedUsers: Array.from(this.data.bannedUsers)
    };
  }

  async init() {
    try {
      this.ensureDataDirectory();
      await this.initJSON();
      if (config.DATABASE_AUTO_SAVE) {
        this.startAutoSave();
      }
    } catch (error) {
      logger.error('Failed to initialize database', { error: error.message });
      this.data = this.createDefaultData();
    }
  }

  ensureDataDirectory() {
    if (!fs.existsSync(config.DATA_PATH)) {
      fs.mkdirSync(config.DATA_PATH, { recursive: true });
    }
  }

  async initJSON() {
    this.storeType = 'json';
    const jsonPath = path.resolve(config.DATA_PATH, 'database.json');
    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        this.data = this.normalizeData(JSON.parse(raw));
        logger.info('JSON database loaded successfully');
      } catch (e) {
        logger.warn('Failed to parse database.json, starting fresh');
        this.data = this.createDefaultData();
        this.save();
      }
    } else {
      this.save();
      logger.info('Created new JSON database');
    }
  }

  save() {
    try {
      const jsonPath = path.resolve(config.DATA_PATH, 'database.json');
      fs.writeFileSync(jsonPath, JSON.stringify(this.serializeData(), null, 2));
      logger.debug('Database saved');
    } catch (error) {
      logger.error('Failed to save database', { error: error.message });
    }
  }

  startAutoSave() {
    setInterval(() => {
      this.save();
    }, config.DATABASE_SAVE_INTERVAL);
    logger.info(`Auto-save enabled every ${config.DATABASE_SAVE_INTERVAL / 60000} minute(s)`);
  }

  // ── User ──────────────────────────────────────────────────────────────

  getUser(userId) {
    const uid = String(userId);
    if (!this.data.users[uid]) {
      this.data.users[uid] = {
        id: uid,
        name: '',
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        messageCount: 0,
        commandCount: 0,
        exp: 0,
        level: 1,
        money: 0,
        data: {}
      };
    }
    return this.data.users[uid];
  }

  updateUser(userId, updates) {
    const user = this.getUser(userId);
    Object.assign(user, updates, { lastSeen: Date.now() });
    this.data.users[String(userId)] = user;
    return user;
  }

  getAllUsers() {
    return Object.values(this.data.users);
  }

  // ── Thread ────────────────────────────────────────────────────────────

  getThreadData(threadId) {
    const tid = String(threadId);
    if (!this.data.threads[tid]) {
      this.data.threads[tid] = {
        id: tid,
        prefix: null,
        name: '',
        banned: false,
        settings: {},
        data: {},
        createdAt: Date.now()
      };
    }
    return this.data.threads[tid];
  }

  setThreadData(threadId, data) {
    const threadData = this.getThreadData(threadId);
    Object.assign(threadData, data);
    this.data.threads[String(threadId)] = threadData;
    return threadData;
  }

  deleteThreadData(threadId) {
    if (this.data.threads[String(threadId)]) {
      delete this.data.threads[String(threadId)];
      return true;
    }
    return false;
  }

  // ── Economy ───────────────────────────────────────────────────────────

  getBalance(userId) {
    const uid = String(userId);
    if (!this.data.economy[uid]) {
      this.data.economy[uid] = { balance: 1000, bank: 0, lastDaily: 0, lastWork: 0 };
    }
    return this.data.economy[uid];
  }

  addBalance(userId, amount) {
    const economy = this.getBalance(userId);
    economy.balance += amount;
    this.data.economy[String(userId)] = economy;
    return economy.balance;
  }

  setBalance(userId, amount) {
    const economy = this.getBalance(userId);
    economy.balance = amount;
    this.data.economy[String(userId)] = economy;
    return economy.balance;
  }

  // ── Stats ─────────────────────────────────────────────────────────────

  incrementStat(key) {
    if (!this.data.stats[key]) this.data.stats[key] = 0;
    this.data.stats[key]++;
  }

  getStat(key) {
    return this.data.stats[key] || 0;
  }

  getAllStats() {
    return this.data.stats;
  }

  // ── Ban ───────────────────────────────────────────────────────────────

  isBanned(userId) {
    const uid = String(userId);
    if (!this.data.bannedUsers.has(uid)) return false;
    const expiry = this.data.bannedUsersExpiry[uid];
    if (expiry && Date.now() > expiry) {
      this.unbanUser(uid);
      return false;
    }
    return true;
  }

  banUser(userId, durationMs = null) {
    const uid = String(userId);
    this.data.bannedUsers.add(uid);
    if (durationMs) {
      this.data.bannedUsersExpiry[uid] = Date.now() + durationMs;
    }
    logger.info(`User ${uid} has been banned`);
  }

  unbanUser(userId) {
    const uid = String(userId);
    this.data.bannedUsers.delete(uid);
    delete this.data.bannedUsersExpiry[uid];
    logger.info(`User ${uid} has been unbanned`);
  }

  // ── Welcome ───────────────────────────────────────────────────────────

  hasBeenWelcomed(userId) { return this.data.welcomedUsers.has(String(userId)); }
  markAsWelcomed(userId) { this.data.welcomedUsers.add(String(userId)); }

  // ── Reminders ─────────────────────────────────────────────────────────

  addReminder(userId, message, triggerTime) {
    const reminder = { id: Date.now().toString(), userId: String(userId), message, triggerTime, createdAt: Date.now() };
    this.data.reminders.push(reminder);
    return reminder;
  }

  getDueReminders() {
    const now = Date.now();
    return this.data.reminders.filter(r => r.triggerTime <= now);
  }

  removeReminder(id) {
    const index = this.data.reminders.findIndex(r => r.id === id);
    if (index > -1) { this.data.reminders.splice(index, 1); return true; }
    return false;
  }

  // ── Auto responses ────────────────────────────────────────────────────

  addAutoResponse(trigger, response, createdBy) {
    const ar = { id: Date.now().toString(), trigger, response, createdBy, createdAt: Date.now() };
    this.data.autoResponses.push(ar);
    return ar;
  }

  removeAutoResponse(id) {
    const index = this.data.autoResponses.findIndex(ar => ar.id === id);
    if (index > -1) { this.data.autoResponses.splice(index, 1); return true; }
    return false;
  }

  getAutoResponses() { return this.data.autoResponses; }

  findAutoResponse(message) {
    return this.data.autoResponses.find(ar => message.toLowerCase().includes(ar.trigger.toLowerCase()));
  }

  // ── Spam tracking ─────────────────────────────────────────────────────

  addSpamWarning(userId) {
    const uid = String(userId);
    if (!this.data.spamWarnings[uid]) this.data.spamWarnings[uid] = { count: 0, lastWarning: 0 };
    this.data.spamWarnings[uid].count++;
    this.data.spamWarnings[uid].lastWarning = Date.now();
    return this.data.spamWarnings[uid].count;
  }

  getSpamWarnings(userId) { return this.data.spamWarnings[String(userId)] || { count: 0, lastWarning: 0 }; }

  // ── Message tracking ──────────────────────────────────────────────────

  trackMessage(userId) {
    const uid = String(userId);
    const now = Date.now();
    if (!this.data.lastMessages[uid]) this.data.lastMessages[uid] = [];
    this.data.lastMessages[uid].push(now);
    const oneMinuteAgo = now - 60000;
    this.data.lastMessages[uid] = this.data.lastMessages[uid].filter(t => t > oneMinuteAgo);
    return this.data.lastMessages[uid].length;
  }

  // ── Sent messages ─────────────────────────────────────────────────────

  storeSentMessage(threadId, itemId) {
    const tid = String(threadId);
    if (!this.data.sentMessages[tid]) this.data.sentMessages[tid] = [];
    this.data.sentMessages[tid].push({ itemId, timestamp: Date.now() });
    if (this.data.sentMessages[tid].length > 50) this.data.sentMessages[tid].shift();
  }

  getLastSentMessage(threadId) {
    const messages = this.data.sentMessages[String(threadId)];
    if (!messages || messages.length === 0) return null;
    const last = messages[messages.length - 1];
    return { itemId: last.itemId, threadId: String(threadId), timestamp: last.timestamp };
  }

  removeSentMessage(threadId, itemId) {
    const messages = this.data.sentMessages[String(threadId)];
    if (!messages) return false;
    const index = messages.findIndex(msg => msg.itemId === itemId);
    if (index > -1) { messages.splice(index, 1); return true; }
    return false;
  }

  getAllSentMessages(threadId) { return this.data.sentMessages[String(threadId)] || []; }

  // ── Processed messages ────────────────────────────────────────────────

  isMessageProcessed(messageId) { return this.data.processedMessages[messageId] !== undefined; }

  markMessageAsProcessed(messageId) {
    this.data.processedMessages[messageId] = Date.now();
    const ids = Object.keys(this.data.processedMessages);
    if (ids.length > 1000) {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      ids.forEach(id => { if (this.data.processedMessages[id] < fiveMinutesAgo) delete this.data.processedMessages[id]; });
    }
  }
}

module.exports = new Database();
