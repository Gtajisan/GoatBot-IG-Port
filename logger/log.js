const logger = require('./index.js');

/**
 * Simplifies large objects like Axios errors to prevent log pollution
 */
function simplifyObject(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

    // Check if it's an Axios error or similar large request error
    if (obj.isAxiosError || obj.config || obj.response) {
        return {
            message: obj.message,
            code: obj.code,
            status: obj.response?.status,
            method: obj.config?.method?.toUpperCase(),
            url: obj.config?.url,
            data: typeof obj.response?.data === 'string'
                ? (obj.response.data.length > 500 ? obj.response.data.slice(0, 500) + '...' : obj.response.data)
                : (typeof obj.response?.data === 'object' ? '[Object]' : obj.response?.data)
        };
    }
    return obj;
}

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
        // Handle (tag, message, meta) vs (message, meta)
        if (typeof args[0] === 'string' && args[0].length < 20 && args[0] === args[0].toUpperCase()) {
            tag = args[0];
            message = args[1];
            if (args.length > 2) {
                meta = typeof args[2] === 'object' && !Array.isArray(args[2]) ? args[2] : { details: args.slice(2) };
            }
        } else {
            message = args[0];
            meta = typeof args[1] === 'object' && !Array.isArray(args[1]) ? args[1] : { details: args.slice(1) };
        }
    }

    // Apply simplification to message and meta properties
    const processedMessage = simplifyObject(message);
    if (meta.error) meta.error = simplifyObject(meta.error);
    if (meta.reason) meta.reason = simplifyObject(meta.reason);

    // Deep simplification for details array
    if (meta.details && Array.isArray(meta.details)) {
        meta.details = meta.details.map(simplifyObject);
    }

    logger.log({
        level,
        tag,
        message: typeof processedMessage === 'object' ? JSON.stringify(processedMessage, null, 2) : String(processedMessage),
        ...meta
    });
}

const log = {
    error: (...args) => formatAndLog('error', args),
    err: (...args) => formatAndLog('error', args),
    warn: (...args) => formatAndLog('warn', args),
    info: (...args) => formatAndLog('info', args),
    success: (...args) => formatAndLog('success', args),
    succes: (...args) => formatAndLog('success', args),
    debug: (...args) => formatAndLog('debug', args),

    // Contextual shortcuts
    command: (name, user, threadID, status = 'SUCCESS') => {
        const level = status === 'SUCCESS' ? 'success' : 'error';
        formatAndLog(level, ['COMMAND', `${name} executed by ${user} in ${threadID}`, { command: name, user, threadID }]);
    },

    load: (...args) => formatAndLog('info', ['LOAD', ...args]),
    master: (...args) => formatAndLog('info', ['MASTER', ...args]),

    // Legacy support or specific tags
    custom: (tag, ...args) => formatAndLog('info', [tag.toUpperCase(), ...args])
};

module.exports = log;
