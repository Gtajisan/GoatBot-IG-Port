const log = require('./log.js');

/**
 * Backward compatibility bridge for loading logs.
 * Redirects to the new unified logger.
 */
module.exports = {
    err: (prefix, message) => log.error(prefix, message),
    error: (prefix, message) => log.error(prefix, message),
    warn: (prefix, message) => log.warn(prefix, message),
    info: (prefix, message) => log.info(prefix, message),
    succes: (prefix, message) => log.success(prefix, message),
    success: (prefix, message) => log.success(prefix, message),
    master: (prefix, message) => log.master(prefix, message)
};
