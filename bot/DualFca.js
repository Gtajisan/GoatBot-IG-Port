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
                // Many commands call sendMessage({body, attachment}, threadID)
                if (prop === 'sendMessage' && typeof args[0] === 'object' && args[0].attachment && !experimentalFca.sendMessageWithAttachment) {
                     if (Array.isArray(args[0].attachment)) {
                         const first = args[0].attachment[0];
                         if (first.type === 'photo' && experimentalFca.sendPhoto) {
                             return await experimentalFca.sendPhoto(first.url, args[1]);
                         }
                     }
                }
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
      if (typeof value === 'function') return value.bind(target);

      // If prop doesn't exist on target, check experimental
      if (typeof value === 'undefined' && experimentalFca) {
          const expValue = experimentalFca[prop];
          if (typeof expValue === 'function') return expValue.bind(experimentalFca);
          return expValue;
      }

      return value;
    }
  };

  return new Proxy(nkxica, handler);
}

module.exports = createDualFca;
