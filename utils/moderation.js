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
    const ue = config.WHITELIST_ENABLE, te = config.WHITELIST_THREAD_ENABLE;
    if (!ue && !te) return true;
    if (ue && te) return this.checkUserWhitelist(userId) || this.checkThreadWhitelist(threadId);
    if (ue) return this.checkUserWhitelist(userId);
    if (te) return this.checkThreadWhitelist(threadId);
    return true;
  }

  checkCommandSpam(userId) {
    const uid = String(userId);
    const threshold = config.SPAM_COMMAND_THRESHOLD;
    const window    = config.SPAM_TIME_WINDOW * 1000;
    const now = Date.now();
    let entry = spamMap.get(uid);
    if (!entry || now - entry.windowStart > window) {
      spamMap.set(uid, { count: 1, windowStart: now });
      return { isSpam: false };
    }
    entry.count++;
    if (entry.count > threshold) {
      return { isSpam: true, shouldBan: true, message: config.HIDE_NOTI.userBanned ? null : '🚫 You have been temporarily banned for spamming commands.' };
    }
    return { isSpam: false };
  }

  resetSpam(userId) { spamMap.delete(String(userId)); }

  async moderateMessage(userId, threadId, messageText) {
    const uid = String(userId), tid = String(threadId);
    if (database.isBanned(uid)) {
      return { allowed: false, reason: 'userBanned', message: config.HIDE_NOTI.userBanned ? null : '🚫 You have been banned from using this bot.' };
    }
    if (!this.checkWhitelist(uid, tid)) {
      return { allowed: false, reason: 'whitelist', message: '⚠️ This bot is in whitelist mode. You are not authorized.' };
    }
    return { allowed: true };
  }
}

module.exports = new ModerationManager();
