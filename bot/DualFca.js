'use strict';

const logger = require('../utils/logger');
const config = require('../config');

/**
 * DualFca - Layered API architecture
 * Defaults to primary, falls back to secondary if configured.
 */
function createDualFca(primary, secondary = null) {
  const handler = {
    get(target, prop) {
      // Methods that support fallback
      const fallbackMethods = [
          'sendMessage', 'sendPhoto', 'sendVideo', 'getUserInfo',
          'getThreadInfo', 'getThreadList', 'sendPhotoFromUrl',
          'sendVideoFromUrl', 'sendAudioFromUrl', 'unsendMessage', 'setMessageReaction', 'markAsRead', 'sendTypingIndicator'
      ];

      if (fallbackMethods.includes(prop) && secondary) {
        return async (...args) => {
          try {
            // Always try primary first
            if (typeof target[prop] === 'function') {
                return await target[prop](...args);
            }
            throw new Error(`Method ${prop} not found on primary API`);
          } catch (error) {
            const fcaConfig = config.USE_FCA_FALLBACK || {};
            const methodKey = prop.replace('send', '').toLowerCase();
            const isFallbackEnabled = fcaConfig.all ||
                                    fcaConfig[methodKey] ||
                                    (methodKey === 'message' && fcaConfig.text) ||
                                    (methodKey === 'photo' && fcaConfig.image) ||
                                    (methodKey === 'photofromurl' && fcaConfig.image) ||
                                    (methodKey === 'video' && fcaConfig.video) ||
                                    (methodKey === 'videofromurl' && fcaConfig.video) ||
                                    (methodKey === 'audiofromurl' && fcaConfig.audio) ||
                                    false;

            if (isFallbackEnabled && secondary && typeof secondary[prop] === 'function') {
              logger.warn(`Primary FCA failed on ${prop}, attempting fallback to secondary...`, { error: error.message });
              try {
                return await secondary[prop](...args);
              } catch (fallbackError) {
                logger.error(`Fallback FCA also failed on ${prop}`, { error: fallbackError.message });
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

      // If prop doesn't exist on target, check secondary
      if (typeof value === 'undefined' && secondary) {
          const secValue = secondary[prop];
          if (typeof secValue === 'function') return secValue.bind(secondary);
          return secValue;
      }

      return value;
    }
  };

  return new Proxy(primary, handler);
}

module.exports = createDualFca;
