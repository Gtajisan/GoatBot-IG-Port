const logger = require('./index.js');

/**
 * Enhanced formatAndLog function to handle various argument styles
 * @param {string} level The log level (info, success, warn, error, debug)
 * @param {Array} args The arguments passed to the log function
 */
function formatAndLog(level, args) {
    let tag = '';
    let message = '';
    let meta = {};

    if (args.length === 1) {
        message = args[0];
    } else if (args.length >= 2) {
        // If the first argument is a short uppercase string or a common tag, treat it as a tag
        const firstArg = args[0];
        const isTag = typeof firstArg === 'string' && (
            (firstArg === firstArg.toUpperCase() && firstArg.length <= 15) ||
            ['LOAD', 'BOT', 'EVENT', 'COMMAND', 'DATABASE', 'AUTH'].includes(firstArg.toUpperCase())
        );

        if (isTag) {
            tag = firstArg;
            message = args[1];
            if (args.length > 2) {
                meta = typeof args[2] === 'object' && !Array.isArray(args[2]) ? args[2] : { details: args.slice(2) };
            }
        } else {
            message = firstArg;
            meta = typeof args[1] === 'object' && !Array.isArray(args[1]) ? args[1] : { details: args.slice(1) };
        }
    }

    logger.log({
        level,
        tag,
        message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
        ...meta
    });
}

const log = {
    err: (...args) => formatAndLog('error', args),
    error: (...args) => formatAndLog('error', args),
    warn: (...args) => formatAndLog('warn', args),
    info: (...args) => formatAndLog('info', args),
    success: (...args) => formatAndLog('success', args),
    succes: (...args) => formatAndLog('success', args),
    debug: (...args) => formatAndLog('debug', args),
    master: (...args) => formatAndLog('info', ['MASTER', ...args]),
    load: (...args) => formatAndLog('info', ['LOAD', ...args]),
    dev: (...args) => {
        if (process.env.NODE_ENV === 'development') {
            formatAndLog('debug', ['DEV', ...args]);
        }
    }
};

module.exports = log;
