'use strict';

const logger = require('../utils/logger');
const config = require('../config');

module.exports = {
  config: { name: 'gc_join', description: 'Welcome new members when they join a group chat' },

  async run(bot, data) {
    try {
      const { api } = bot;
      const { threadID, addedParticipants } = data;
      if (!addedParticipants || addedParticipants.length === 0) return;

      for (const participant of addedParticipants) {
        const userId   = String(participant.userFbId || participant.userId || '');
        const fullName = participant.fullName || participant.name || `User ${userId}`;
        logger.info(`New member joined ${threadID}: ${fullName} (${userId})`);
        await api.sendMessage(
          `👋 Welcome to the group, ${fullName}!\n\nType ${config.PREFIX}help to see what I can do.`,
          threadID
        );
      }
    } catch (error) {
      logger.error('Error in gc_join event', { error: error.message });
    }
  }
};
