'use strict';

/**
 * User Agent utilities for Instagram-FCA
 * Provides realistic user agents to avoid detection
 *
 * @author Gtajisan <ffjisan804@gmail.com>
 * @github https://github.com/Gtajisan
 */

// Realistic Android user agents for Instagram
const USER_AGENTS = [
  // Samsung Galaxy S23 Ultra
  'Instagram 302.1.0.36.111 Android (33/13; 560dpi; 1440x3088; samsung; SM-S918B; dm3q; qcom; en_US; 539909420)',

  // Samsung Galaxy S22
  'Instagram 302.1.0.36.111 Android (33/13; 480dpi; 1080x2340; samsung; SM-S901B; r0q; qcom; en_US; 539909420)',

  // Samsung Galaxy S21
  'Instagram 302.1.0.36.111 Android (31/12; 480dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 539909420)',

  // Google Pixel 8 Pro
  'Instagram 302.1.0.36.111 Android (34/14; 560dpi; 1344x2992; Google; Pixel 8 Pro; husky; tensor; en_US; 539909420)',

  // Google Pixel 7
  'Instagram 302.1.0.36.111 Android (33/13; 420dpi; 1080x2400; Google; Pixel 7; panther; tensor; en_US; 539909420)',

  // OnePlus 11
  'Instagram 302.1.0.36.111 Android (33/13; 480dpi; 1440x3216; OnePlus; CPH2447; OP594DL1; qcom; en_US; 539909420)',

  // Xiaomi 13 Pro
  'Instagram 302.1.0.36.111 Android (33/13; 480dpi; 1440x3200; Xiaomi; 2210132G; nuwa; qcom; en_US; 539909420)',

  // Xiaomi 12
  'Instagram 302.1.0.36.111 Android (32/12; 440dpi; 1080x2400; Xiaomi; 2201123G; cupid; qcom; en_US; 539909420)',

  // Samsung Galaxy A54
  'Instagram 302.1.0.36.111 Android (33/13; 393dpi; 1080x2340; samsung; SM-A546B; a54x; exynos1380; en_US; 539909420)',

  // Oppo Find X5
  'Instagram 302.1.0.36.111 Android (32/12; 480dpi; 1080x2400; OPPO; PFFM10; OP52E1L1; qcom; en_US; 539909420)',

  // Vivo X80
  'Instagram 302.1.0.36.111 Android (32/12; 480dpi; 1080x2400; vivo; V2183A; PD2183; qcom; en_US; 539909420)',

  // Realme GT 3
  'Instagram 302.1.0.36.111 Android (33/13; 480dpi; 1080x2412; realme; RMX3709; RE58C2L1; qcom; en_US; 539909420)',

  // Samsung Galaxy Z Fold 5
  'Instagram 302.1.0.36.111 Android (33/13; 420dpi; 1812x2176; samsung; SM-F946B; q5q; qcom; en_US; 539909420)',

  // Asus ROG Phone 7
  'Instagram 302.1.0.36.111 Android (33/13; 480dpi; 1080x2448; asus; ASUS_AI2205; AI2205; qcom; en_US; 539909420)'
];

// Web user agents (for fallback)
const WEB_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

/**
 * Get random user agent
 * @param {string} [type='android'] - Type of user agent ('android' or 'web')
 * @returns {string} Random user agent
 */
function getRandomUserAgent(type = 'android') {
  const agents = type === 'web' ? WEB_USER_AGENTS : USER_AGENTS;
  return agents[Math.floor(Math.random() * agents.length)];
}

/**
 * Get user agent by index
 * @param {number} index - Index of user agent
 * @param {string} [type='android'] - Type of user agent
 * @returns {string} User agent
 */
function getUserAgentByIndex(index, type = 'android') {
  const agents = type === 'web' ? WEB_USER_AGENTS : USER_AGENTS;
  return agents[index % agents.length];
}

/**
 * Parse user agent to extract device info
 * @param {string} userAgent - User agent string
 * @returns {Object} Device info
 */
function parseUserAgent(userAgent) {
  const match = userAgent.match(/Instagram (\S+) Android \((\d+)\/(\d+); (\d+)dpi; (\d+x\d+); ([^;]+); ([^;]+); ([^;]+); ([^;]+)/);

  if (match) {
    return {
      appVersion: match[1],
      androidVersion: parseInt(match[2]),
      androidRelease: match[3],
      dpi: match[4],
      resolution: match[5],
      manufacturer: match[6],
      model: match[7],
      device: match[8],
      cpu: match[9]
    };
  }

  return null;
}

/**
 * Generate custom user agent
 * @param {Object} options - Options
 * @returns {string} Custom user agent
 */
function generateUserAgent(options = {}) {
  const {
    appVersion = '302.1.0.36.111',
    androidVersion = 33,
    androidRelease = '13',
    dpi = '480dpi',
    resolution = '1080x2400',
    manufacturer = 'samsung',
    model = 'SM-G998B',
    device = 'p3s',
    cpu = 'exynos2100',
    locale = 'en_US',
    versionCode = '539909420'
  } = options;

  return `Instagram ${appVersion} Android (${androidVersion}/${androidRelease}; ${dpi}; ${resolution}; ${manufacturer}; ${model}; ${device}; ${cpu}; ${locale}; ${versionCode})`;
}

module.exports = {
  USER_AGENTS,
  WEB_USER_AGENTS,
  getRandomUserAgent,
  getUserAgentByIndex,
  parseUserAgent,
  generateUserAgent
};
