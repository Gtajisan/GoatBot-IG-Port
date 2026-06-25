'use strict';

const logger = require('../../utils/logger');
const Banner = require('../../utils/banner');
const config = require('../../config');

module.exports = {
  config: { name: 'ready', description: 'Fired once the bot connects to Instagram' },

  async run(bot, data) {
    const commandCount = bot.commandLoader.getAllCommandNames().length;
    const eventCount   = bot.eventLoader.getAllEventNames().length;
    logger.info('Bot is ready and connected!', { userID: bot.userID });
    Banner.startupMessage(bot.userID, bot.username, commandCount, eventCount);
    logger.info(
      `✅ ${config.BOT_NAME} is online — ${commandCount} commands | ${eventCount} events | prefix: "${config.PREFIX}"`
    );
  }
};
