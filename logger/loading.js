const log = require('./log.js');

/**
 * Legacy loading logger for backward compatibility
 */
module.exports = {
    err: (...args) => log.error('LOAD', ...args),
    error: (...args) => log.error('LOAD', ...args),
    warn: (...args) => log.warn('LOAD', ...args),
    info: (...args) => log.info('LOAD', ...args),
    succes: (...args) => log.success('LOAD', ...args),
    success: (...args) => log.success('LOAD', ...args),
    master: (...args) => log.master(...args)
};
