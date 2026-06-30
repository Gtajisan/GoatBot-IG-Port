const logger = require('../utils/logger');
const Banner = require('../utils/banner');
const config = require('../config');

module.exports = {
  config: { name: 'ready', description: 'Fired once the bot connects to Instagram' },
  async run(bot) {
    const cc = bot.commandLoader.getAllCommandNames().length;
    const ec = bot.eventLoader.getAllEventNames().length;
    Banner.startupMessage(bot.userID, bot.username, cc, ec);
    logger.info(`✅ ${config.NICK_NAME_BOT} online — ${cc} cmds | ${ec} events | prefix: "${config.PREFIX}"`);

    const database = require('../utils/database');
    const usersData = database.usersData;
    const threadsData = database.threadsData;

    // Call global ready for GoatBot V2 commands
    for (const [name, cmd] of bot.commandLoader.commands) {
        if (typeof cmd.onReady === 'function') {
            try {
                await cmd.onReady({ api: bot.api, bot, database, usersData, threadsData });
            } catch (e) {
                logger.error(`onReady error in ${name}`, { error: e.message });
            }
        }
    }

    // Trigger onStart for events that should run on startup
    for (const event of bot.eventLoader.events.values()) {
        if (event.config.name === 'checkPremiumExpiry') {
            try {
                await event.run({ bot, database, logger });
            } catch (e) {}
        }
    }
  }
};
