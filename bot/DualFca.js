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
      const fallbackMethods = [
          'sendMessage', 'sendPhoto', 'sendVideo', 'getUserInfo',
          'getThreadInfo', 'getThreadList', 'sendPhotoFromUrl',
          'sendVideoFromUrl', 'sendAudioFromUrl'
      ];

      if (fallbackMethods.includes(prop) && experimentalFca) {
        return async (...args) => {
          try {
            // Always try primary (nkxica) first
            if (typeof target[prop] === 'function') {
                return await target[prop](...args);
            }
            throw new Error(`Method ${prop} not found on primary API`);
          } catch (error) {
            const isFallbackEnabled = config.USE_FCA_FALLBACK?.all || false;

            if (isFallbackEnabled && experimentalFca && typeof experimentalFca[prop] === 'function') {
              logger.warn(`Primary FCA (nkxica) failed on ${prop}, attempting fallback to Instagram-FCA...`, { error: error.message });
              try {
                // Logic for FromUrl fallbacks if experimental doesn't have them
                if (prop.endsWith('FromUrl') && !experimentalFca[prop]) {
                    const type = prop.replace('send', '').replace('FromUrl', '').toLowerCase();
                    if (type === 'photo' && experimentalFca.sendPhoto) return await experimentalFca.sendPhoto(args[1], args[0]);
                    if (type === 'video' && experimentalFca.sendVideo) return await experimentalFca.sendVideo(args[1], args[0]);
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
