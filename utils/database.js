const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const config = require('../config');

class Database {
  constructor() {
    this.data = this._default();
    this.dbPath = path.resolve(config.DATABASE_PATH || './storage/data/bot.sqlite');
    this.storeType = 'json';
    this.ready = this.init();
  }

  _default() {
    return {
      users: {}, threads: {}, stats: {}, economy: {},
      reminders: [], autoResponses: [],
      welcomedUsers: new Set(), bannedUsers: new Set(),
      spamWarnings: {}, lastMessages: {}, sentMessages: {}, processedMessages: {}
    };
  }

  _normalize(d = {}) {
    return {
      users: d.users || {}, threads: d.threads || {}, stats: d.stats || {},
      economy: d.economy || {}, reminders: d.reminders || [], autoResponses: d.autoResponses || [],
      welcomedUsers: new Set(d.welcomedUsers || []), bannedUsers: new Set(d.bannedUsers || []),
      spamWarnings: d.spamWarnings || {}, lastMessages: d.lastMessages || {},
      sentMessages: d.sentMessages || {}, processedMessages: d.processedMessages || {}
    };
  }

  _serialize() {
    return { ...this.data, welcomedUsers: [...this.data.welcomedUsers], bannedUsers: [...this.data.bannedUsers] };
  }

  _ensureDir() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  async init() {
    try {
      this._ensureDir();
      const jsonPath = this.dbPath.replace('.sqlite', '.json');
      if (fs.existsSync(jsonPath)) {
        this.data = this._normalize(JSON.parse(fs.readFileSync(jsonPath, 'utf-8')));
        logger.info('Database loaded from JSON');
      } else {
        this.save();
        logger.info('Created new database');
      }
      if (config.DATABASE_AUTO_SAVE) {
        setInterval(() => this.save(), config.DATABASE_SAVE_INTERVAL || 60000);
        logger.info('Auto-save enabled');
      }
    } catch (e) {
      logger.error('Failed to init database', { error: e.message });
      this.data = this._default();
    }
  }

  save() {
    try {
      const jsonPath = this.dbPath.replace('.sqlite', '.json');
      this._ensureDir();
      fs.writeFileSync(jsonPath, JSON.stringify(this._serialize(), null, 2));
      logger.debug('Database saved');
    } catch (e) { logger.error('Failed to save database', { error: e.message }); }
  }

  getUser(uid) {
    if (!this.data.users[uid]) this.data.users[uid] = { id: uid, firstSeen: Date.now(), lastSeen: Date.now(), messageCount: 0, commandCount: 0 };
    return this.data.users[uid];
  }

  updateUser(uid, updates) {
    const u = this.getUser(uid);
    Object.assign(u, updates, { lastSeen: Date.now() });
    this.data.users[uid] = u;
    return u;
  }

  getBalance(uid) {
    if (!this.data.economy[uid]) this.data.economy[uid] = { balance: 1000, bank: 0, lastDaily: 0, lastWork: 0 };
    return this.data.economy[uid];
  }

  addBalance(uid, amt) { const e = this.getBalance(uid); e.balance += amt; this.data.economy[uid] = e; return e.balance; }

  incrementStat(key) { this.data.stats[key] = (this.data.stats[key] || 0) + 1; }
  getStat(key)       { return this.data.stats[key] || 0; }

  hasBeenWelcomed(uid) { return this.data.welcomedUsers.has(uid); }
  markAsWelcomed(uid)  { this.data.welcomedUsers.add(uid); }

  isBanned(uid) { return this.data.bannedUsers.has(String(uid)); }
  banUser(uid)  { this.data.bannedUsers.add(String(uid)); logger.info(`User ${uid} banned`); }
  unbanUser(uid){ this.data.bannedUsers.delete(String(uid)); logger.info(`User ${uid} unbanned`); }

  getThreadData(tid) {
    if (!this.data.threads[tid]) this.data.threads[tid] = { id: tid, prefix: null, settings: {}, createdAt: Date.now() };
    return this.data.threads[tid];
  }

  setThreadData(tid, data) {
    const t = this.getThreadData(tid);
    Object.assign(t, data);
    this.data.threads[tid] = t;
    return t;
  }

  deleteThreadData(tid) {
    if (this.data.threads[tid]) { delete this.data.threads[tid]; return true; }
    return false;
  }

  addAutoResponse(trigger, response, createdBy) {
    const ar = { id: Date.now().toString(), trigger, response, createdBy, createdAt: Date.now() };
    this.data.autoResponses.push(ar);
    return ar;
  }

  removeAutoResponse(id) {
    const i = this.data.autoResponses.findIndex(a => a.id === id);
    if (i > -1) { this.data.autoResponses.splice(i, 1); return true; }
    return false;
  }

  getAutoResponses() { return this.data.autoResponses; }

  findAutoResponse(msg) {
    return this.data.autoResponses.find(a => msg.toLowerCase().includes(a.trigger.toLowerCase()));
  }

  addReminder(userId, message, triggerTime) {
    const r = { id: Date.now().toString(), userId, message, triggerTime, createdAt: Date.now() };
    this.data.reminders.push(r);
    return r;
  }

  getDueReminders() { return this.data.reminders.filter(r => r.triggerTime <= Date.now()); }

  removeReminder(id) {
    const i = this.data.reminders.findIndex(r => r.id === id);
    if (i > -1) { this.data.reminders.splice(i, 1); return true; }
    return false;
  }

  getAllUsers() { return Object.values(this.data.users); }
  getAllStats() { return this.data.stats; }

  storeSentMessage(threadId, itemId) {
    if (!this.data.sentMessages[threadId]) this.data.sentMessages[threadId] = [];
    this.data.sentMessages[threadId].push({ itemId, timestamp: Date.now() });
    if (this.data.sentMessages[threadId].length > 50) this.data.sentMessages[threadId].shift();
  }

  getLastSentMessage(threadId) {
    const msgs = this.data.sentMessages[threadId];
    if (!msgs || !msgs.length) return null;
    const last = msgs[msgs.length - 1];
    return { itemId: last.itemId, threadId, timestamp: last.timestamp };
  }

  removeSentMessage(threadId, itemId) {
    if (!this.data.sentMessages[threadId]) return false;
    const i = this.data.sentMessages[threadId].findIndex(m => m.itemId === itemId);
    if (i > -1) { this.data.sentMessages[threadId].splice(i, 1); return true; }
    return false;
  }

  getAllSentMessages(threadId) { return this.data.sentMessages[threadId] || []; }

  isMessageProcessed(msgId) { return this.data.processedMessages[msgId] !== undefined; }

  markMessageAsProcessed(msgId) {
    this.data.processedMessages[msgId] = Date.now();
    const keys = Object.keys(this.data.processedMessages);
    if (keys.length > 1000) {
      const cutoff = Date.now() - 5 * 60 * 1000;
      keys.forEach(k => { if (this.data.processedMessages[k] < cutoff) delete this.data.processedMessages[k]; });
    }
  }

  trackMessage(uid) {
    const now = Date.now();
    if (!this.data.lastMessages[uid]) this.data.lastMessages[uid] = [];
    this.data.lastMessages[uid].push(now);
    const cutoff = now - 60000;
    this.data.lastMessages[uid] = this.data.lastMessages[uid].filter(t => t > cutoff);
    return this.data.lastMessages[uid].length;
  }

  addSpamWarning(uid) {
    if (!this.data.spamWarnings[uid]) this.data.spamWarnings[uid] = { count: 0, lastWarning: 0 };
    this.data.spamWarnings[uid].count++;
    this.data.spamWarnings[uid].lastWarning = Date.now();
    return this.data.spamWarnings[uid].count;
  }
}

module.exports = new Database();
