'use strict';

const InstagramBot = require('./bot/InstagramBot');
const logger = require('./utils/logger');

const bot = new InstagramBot();

bot.start().catch(error => {
  logger.error('Fatal error during startup', { error: error.message, stack: error.stack });
  process.exit(1);
});
