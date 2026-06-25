const logger = require('../utils/logger');

function formatAndLog(level, args) {
    let tag = '';
    let message = '';
    let meta = {};

    if (args.length === 1) {
        message = args[0];
    } else if (args.length >= 2) {
        if (typeof args[0] === 'string' && (args[0] === args[0].toUpperCase() || args[0].length < 15)) {
            tag = args[0];
            message = args[1];
            if (args.length > 2) {
                meta = typeof args[2] === 'object' && !Array.isArray(args[2]) ? args[2] : { details: args.slice(2) };
            }
        } else {
            message = args[0];
            meta = args[1];
        }
    }

    logger.log({
        level,
        tag,
        message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
        ...meta
    });
}

const logBridge = {
    err: (...args) => formatAndLog('error', args),
    error: (...args) => formatAndLog('error', args),
    warn: (...args) => formatAndLog('warn', args),
    info: (...args) => formatAndLog('info', args),
    success: (...args) => formatAndLog('success', args),
    debug: (...args) => formatAndLog('debug', args),
    master: (...args) => formatAndLog('info', ['MASTER', ...args]),
    dev: (...args) => {
        if (process.env.NODE_ENV === 'development') formatAndLog('debug', ['DEV', ...args]);
    }
};

module.exports = logBridge;
