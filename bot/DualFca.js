'use strict';

const logger = require('../utils/logger');
const config = require('../config');

/**
 * DualFca - Layered API architecture
 * Defaults to nkxica, falls back to experimental Instagram-FCA if configured.
 */
function createDualFca(nkxica, experimentalFca = null) {
  const handler = {
    get(target, prop) {
      // Methods that support fallback
      const fallbackMethods = ['sendMessage', 'sendPhoto', 'sendVideo'];

      if (fallbackMethods.includes(prop) && experimentalFca) {
        return async (...args) => {
          let mediaType = 'text';
          if (prop === 'sendPhoto') mediaType = 'image';
          if (prop === 'sendVideo') mediaType = 'video';

          const isFallbackEnabled = config.USE_FCA_FALLBACK?.[mediaType] || false;

          try {
            // Always try primary (nkxica) first
            return await target[prop](...args);
          } catch (error) {
            if (isFallbackEnabled && experimentalFca) {
              logger.warn(`Primary FCA (nkxica) failed on ${prop}, attempting fallback to Instagram-FCA...`, { error: error.message });
              try {
                // Adapt args if necessary: Instagram-FCA's sendPhoto expects (stream/path, threadID)
                // nkxica's wrapped sendMessage expects ({ body, attachment }, threadID) or similar
                // We'll need to normalize these calls in the bot.
                return await experimentalFca[prop](...args);
              } catch (fallbackError) {
                logger.error(`Fallback FCA (Instagram-FCA) also failed on ${prop}`, { error: fallbackError.message });
                throw fallbackError;
              }
            }
            throw error;
          }
        };
      }

      // Default to primary for everything else
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    }
  };

  return new Proxy(nkxica, handler);
}

module.exports = createDualFca;
