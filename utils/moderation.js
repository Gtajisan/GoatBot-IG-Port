'use strict';

const config = require('../config');
const logger = require('./logger');
const database = require('./database');

const spamMap = new Map();

class ModerationManager {
  checkUserWhitelist(userId) {
    if (!config.WHITELIST_ENABLE) return true;
    return config.WHITELIST_IDS.includes(String(userId));
  }

  checkThreadWhitelist(threadId) {
    if (!config.WHITELIST_THREAD_ENABLE) return true;
    return config.WHITELIST_THREAD_IDS.includes(String(threadId));
  }

  checkWhitelist(userId, threadId) {
    const userEnabled   = config.WHITELIST_ENABLE;
    const threadEnabled = config.WHITELIST_THREAD_ENABLE;
    if (!userEnabled && !threadEnabled) return true;
    if (userEnabled && threadEnabled) return this.checkUserWhitelist(userId) || this.checkThreadWhitelist(threadId);
    if (userEnabled)   return this.checkUserWhitelist(userId);
    if (threadEnabled) return this.checkThreadWhitelist(threadId);
    return true;
  }

  checkCommandSpam(userId) {
    const uid       = String(userId);
    const threshold = config.SPAM_COMMAND_THRESHOLD;
    const window    = config.SPAM_TIME_WINDOW * 1000;
    const now       = Date.now();
    let entry = spamMap.get(uid);
    if (!entry || now - entry.windowStart > window) {
      entry = { count: 1, windowStart: now };
      spamMap.set(uid, entry);
      return { isSpam: false };
    }
    entry.count++;
    if (entry.count > threshold) {
      return {
        isSpam: true,
        shouldBan: true,
        message: config.HIDE_NOTI.userBanned ? null : '🚫 You have been temporarily banned for spamming commands.'
      };
    }
    return { isSpam: false };
  }

  resetSpam(userId) { spamMap.delete(String(userId)); }

  async moderateMessage(userId, threadId, messageText) {
    const uid = String(userId);
    const tid = String(threadId);
    if (database.isBanned(uid)) {
      return { allowed: false, reason: 'userBanned', message: config.HIDE_NOTI.userBanned ? null : '🚫 You have been banned from using this bot.' };
    }
    if (!this.checkWhitelist(uid, tid)) {
      return { allowed: false, reason: 'whitelist', message: '⚠️ This bot is in whitelist mode. You are not authorized to use it.' };
    }
    return { allowed: true };
  }
}

module.exports = new ModerationManager();
