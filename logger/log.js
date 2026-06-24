const logger = require('./index.js');
const { colors } = require('../func/colors.js');

function formatMessage(prefix, message) {
    if (message === undefined) {
        return { tag: 'SYSTEM', msg: prefix };
    }
    return { tag: prefix, msg: message };
}

module.exports = {
    err: (prefix, message, ...args) => {
        const { tag, msg } = formatMessage(prefix, message);
        logger.error(msg, { tag, ...args });
    },
    error: (prefix, message, ...args) => {
        const { tag, msg } = formatMessage(prefix, message);
        logger.error(msg, { tag, ...args });
    },
    warn: (prefix, message, ...args) => {
        const { tag, msg } = formatMessage(prefix, message);
        logger.warn(msg, { tag, ...args });
    },
    info: (prefix, message, ...args) => {
        const { tag, msg } = formatMessage(prefix, message);
        logger.info(msg, { tag, ...args });
    },
    success: (prefix, message, ...args) => {
        const { tag, msg } = formatMessage(prefix, message);
        logger.success(msg, { tag, ...args });
    },
    master: (prefix, message, ...args) => {
        const { tag, msg } = formatMessage(prefix, message);
        logger.info(msg, { tag: tag || 'MASTER', ...args });
    },
    debug: (prefix, message, ...args) => {
        const { tag, msg } = formatMessage(prefix, message);
        logger.debug(msg, { tag, ...args });
    },
    dev: (...args) => {
        if (["development", "production"].includes(process.env.NODE_ENV) == false)
            return;
        try {
            throw new Error();
        }
        catch (err) {
            const at = err.stack.split('\n')[2];
            let position = at.slice(at.indexOf(process.cwd()) + process.cwd().length + 1);
            position.endsWith(')') ? position = position.slice(0, -1) : null;
            logger.debug(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), { tag: 'DEV', position });
        }
    }
};
