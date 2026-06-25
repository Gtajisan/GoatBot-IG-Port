const logger = require('./logger');
const config = require('../config');

class Banner {
  static display() {
    console.log('\x1b[36m%s\x1b[0m', `
  ██╗███╗   ██╗███████╗████████╗ █████╗ ██████╗  ██████╗ ████████╗
  ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝
  ██║██╔██╗ ██║███████╗   ██║   ███████║██████╔╝██║   ██║   ██║
  ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██╔══██╗██║   ██║   ██║
  ██║██║ ╚████║███████║   ██║   ██║  ██║██████╔╝╚██████╔╝   ██║
  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═╝
                              GoatBot-IG v${config.BOT_VERSION} by Gtajisan
`);
  }

  static startupMessage(userID, username, commandCount, eventCount) {
    logger.success(`${config.NICK_NAME_BOT} started successfully`);
    logger.info(`User: @${username || 'Loading...'} (${userID || 'Loading...'})`);
    logger.info(`Loaded ${commandCount} commands and ${eventCount} events`);
    logger.info(`Prefix: ${config.PREFIX}`);
    logger.success('Listening for messages...');
  }

  static commandExecuted(name, user, ok = true) { logger.command(name, user, ok); }

  static messageReceived(from, preview) {
    if ((config.LOG_LEVEL || 'info') === 'debug') {
      let p = '';
      try { p = typeof preview === 'string' ? preview : JSON.stringify(preview); } catch (_) { p = '[n/a]'; }
      logger.debug(`Message from ${from}: ${p.length > 40 ? p.substring(0, 40) + '...' : p}`);
    }
  }

  static error(ctx, err) { logger.error(`${ctx}: ${err}`); }
  static info(msg)    { logger.info(msg); }
  static warning(msg) { logger.warn(msg); }
  static success(msg) { logger.success(msg); }
}

module.exports = Banner;
