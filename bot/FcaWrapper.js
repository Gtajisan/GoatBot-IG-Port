'use strict';

const logger = require('../utils/logger');
const config = require('../config');

/**
 * FcaWrapper - A dual-path wrapper for Instagram FCAs
 * Primary: nkxica (proven default)
 * Fallback: Instagram-FCA (experimental/secondary)
 */
class FcaWrapper {
    constructor(nkxicaApi, fcaApi = null) {
        this.nkxica = nkxicaApi;
        this.fca = fcaApi; // Instagram-FCA instance
    }

    async sendMessage(message, threadID, callback) {
        const fallbackEnabled = config.USE_FCA_FALLBACK?.text || false;

        try {
            // Primary path
            return await this.nkxica.sendMessage(message, threadID, callback);
        } catch (error) {
            logger.warn('nkxica sendMessage failed', { error: error.message, threadID });

            if (fallbackEnabled && this.fca) {
                logger.info('Attempting fallback to Instagram-FCA...', { threadID });
                try {
                    return await this.fca.sendMessage(message, threadID, callback);
                } catch (fcaError) {
                    logger.error('Instagram-FCA fallback failed', { error: fcaError.message });
                    throw fcaError;
                }
            }
            throw error;
        }
    }

    async sendPhoto(stream, threadID, callback) {
        const fallbackEnabled = config.USE_FCA_FALLBACK?.image || false;
        try {
            // nkxica handles photos via its own internal logic in sendMessage if body is buffer/stream?
            // Actually InstagramBot.js createAPIWrapper has a sendMessage that handles attachments.
            return await this.nkxica.sendMessage({ attachment: stream }, threadID, callback);
        } catch (error) {
            if (fallbackEnabled && this.fca && typeof this.fca.sendPhoto === 'function') {
                return await this.fca.sendPhoto(stream, threadID, callback);
            }
            throw error;
        }
    }

    // ... other methods following the same pattern
}

module.exports = FcaWrapper;
