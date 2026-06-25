'use strict';

const logger = require('../utils/logger');
const config = require('../config');

module.exports = {
  config: { name: 'gc_leave', description: 'Farewell message when a member leaves' },

  async run(bot, data) {
    try {
      if (config.LOG_EVENTS.disableAll || !config.LOG_EVENTS.event) return;
      const { api } = bot;
      const { threadID, leftUserId } = data;
      if (!leftUserId) return;
      if (String(leftUserId) === String(bot.userID)) return;

      let displayName = `User ${leftUserId}`;
      try {
        const info = await api.getUserInfo(leftUserId);
        if (info) {
          const userData = info[leftUserId] || Object.values(info)[0];
          if (userData) displayName = userData.name || userData.fullName || displayName;
        }
      } catch (_) {}

      logger.info(`Member left ${threadID}: ${leftUserId}`);
      await api.sendMessage(`👋 ${displayName} has left the group. We'll miss you!`, threadID);
    } catch (error) {
      logger.error('Error in gc_leave event', { error: error.message });
    }
  }
};
