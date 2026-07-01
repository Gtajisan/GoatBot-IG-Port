'use strict';

/**
 * Session Management for Instagram-FCA
 * Handles cookies, tokens, and session persistence
 *
 * @author Gtajisan <ffjisan804@gmail.com>
 * @github https://github.com/Gtajisan
 */

const { CookieJar, Cookie } = require('tough-cookie');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { getRandomUserAgent } = require('../lib/userAgents');
const { generateDeviceId, generateUUID } = require('../lib/crypto');

class Session {
  constructor(options = {}) {
    this.options = options;

    // Session identifiers
    this.userId = null;
    this.username = null;
    this.isLoggedIn = false;

    // Device identifiers
    this.deviceId = null;
    this.uuid = null;
    this.phoneId = null;
    this.advertisingId = null;

    // Tokens
    this.csrfToken = null;
    this.authToken = null;
    this.fbAccessToken = null;

    // User agent
    this.userAgent = options.userAgent || getRandomUserAgent();

    // Cookie jar for session cookies
    this.cookieJar = new CookieJar();

    // Proxy settings
    this.proxy = null;
    this.proxyAgent = null;

    // Session health metrics
    this.metrics = {
      createdAt: Date.now(),
      lastActivity: Date.now(),
      requestCount: 0,
      errorCount: 0,
      reconnectCount: 0
    };

    // Realtime connection state
    this.realtimeConnected = false;
    this.realtimeSequenceId = null;

    // Session persistence path
    this.sessionPath = options.sessionPath || null;
  }

  /**
   * Load appState (cookies) into session
   * @param {Array} appState - Array of cookie objects
   */
  loadAppState(appState) {
    if (!Array.isArray(appState)) {
      throw new Error('appState must be an array of cookies');
    }

    for (const cookie of appState) {
      try {
        const cookieStr = this._formatCookie(cookie);
        const domain = cookie.domain || '.instagram.com';
        const url = `https://${domain.replace(/^\./, '')}`;

        this.cookieJar.setCookieSync(cookieStr, url);

        // Extract important tokens
        if (cookie.name === 'csrftoken' || cookie.key === 'csrftoken') {
          this.csrfToken = cookie.value;
        }
        if (cookie.name === 'ds_user_id' || cookie.key === 'ds_user_id') {
          this.userId = cookie.value;
        }
        if (cookie.name === 'sessionid' || cookie.key === 'sessionid') {
          this.authToken = cookie.value;
        }
      } catch (error) {
        console.warn(`Failed to load cookie: ${cookie.name || cookie.key}`, error.message);
      }
    }

    this.isLoggedIn = !!this.authToken;
  }

  /**
   * Format cookie object to cookie string
   * @param {Object} cookie - Cookie object
   * @returns {string} Cookie string
   */
  _formatCookie(cookie) {
    const name = cookie.name || cookie.key;
    const value = cookie.value;
    const domain = cookie.domain || '.instagram.com';
    const path = cookie.path || '/';
    const secure = cookie.secure !== false;
    const httpOnly = cookie.httpOnly !== false;
    const expires = cookie.expires || cookie.expirationDate;

    let cookieStr = `${name}=${value}; Domain=${domain}; Path=${path}`;

    if (secure) cookieStr += '; Secure';
    if (httpOnly) cookieStr += '; HttpOnly';
    if (expires) {
      const expiresDate = typeof expires === 'number'
        ? new Date(expires * 1000)
        : new Date(expires);
      cookieStr += `; Expires=${expiresDate.toUTCString()}`;
    }

    return cookieStr;
  }

  /**
   * Get appState (cookies) from session
   * @returns {Array} Array of cookie objects
   */
  getAppState() {
    const cookies = this.cookieJar.toJSON().cookies;

    return cookies.map(cookie => ({
      key: cookie.key,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      expires: cookie.expires,
      creation: cookie.creation,
      lastAccessed: cookie.lastAccessed
    }));
  }

  /**
   * Save appState to file
   * @param {string} filePath - Path to save appState
   */
  saveAppState(filePath) {
    const appState = this.getAppState();
    fs.writeFileSync(filePath, JSON.stringify(appState, null, 2));
  }

  /**
   * Load appState from file
   * @param {string} filePath - Path to load appState from
   */
  loadAppStateFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`AppState file not found: ${filePath}`);
    }

    const appState = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    this.loadAppState(appState);
  }

  /**
   * Set proxy for session
   * @param {string} proxyUrl - Proxy URL (http://host:port or socks5://host:port)
   */
  setProxy(proxyUrl) {
    this.proxy = proxyUrl;

    if (proxyUrl.startsWith('socks')) {
      const { SocksProxyAgent } = require('socks-proxy-agent');
      this.proxyAgent = new SocksProxyAgent(proxyUrl);
    } else {
      const { HttpsProxyAgent } = require('https-proxy-agent');
      this.proxyAgent = new HttpsProxyAgent(proxyUrl);
    }
  }

  /**
   * Get cookies string for request header
   * @param {string} url - Request URL
   * @returns {string} Cookie header value
   */
  getCookieString(url = 'https://i.instagram.com') {
    return this.cookieJar.getCookieStringSync(url);
  }

  /**
   * Set cookie from response
   * @param {string} cookieString - Set-Cookie header value
   * @param {string} url - Request URL
   */
  setCookie(cookieString, url = 'https://i.instagram.com') {
    try {
      this.cookieJar.setCookieSync(cookieString, url);
    } catch (error) {
      // Ignore invalid cookies
    }
  }

  /**
   * Update session activity timestamp
   */
  updateActivity() {
    this.metrics.lastActivity = Date.now();
    this.metrics.requestCount++;
  }

  /**
   * Record error in session metrics
   */
  recordError() {
    this.metrics.errorCount++;
  }

  /**
   * Record reconnection in session metrics
   */
  recordReconnect() {
    this.metrics.reconnectCount++;
  }

  /**
   * Get session health metrics
   * @returns {Object} Health metrics
   */
  getHealthMetrics() {
    const now = Date.now();
    return {
      status: this.isLoggedIn ? 'connected' : 'disconnected',
      userId: this.userId,
      username: this.username,
      uptime: now - this.metrics.createdAt,
      lastActivity: now - this.metrics.lastActivity,
      requestCount: this.metrics.requestCount,
      errorCount: this.metrics.errorCount,
      reconnectCount: this.metrics.reconnectCount,
      realtimeConnected: this.realtimeConnected
    };
  }

  /**
   * Get memory metrics
   * @returns {Object} Memory metrics
   */
  getMemoryMetrics() {
    const cookies = this.getAppState();
    return {
      cookieCount: cookies.length,
      hasValidSession: this.isLoggedIn,
      hasCsrfToken: !!this.csrfToken,
      hasAuthToken: !!this.authToken
    };
  }

  /**
   * Check if session is valid
   * @returns {boolean} Whether session is valid
   */
  isValid() {
    return this.isLoggedIn && !!this.authToken && !!this.csrfToken;
  }

  /**
   * Clear session data
   */
  clear() {
    this.userId = null;
    this.username = null;
    this.isLoggedIn = false;
    this.csrfToken = null;
    this.authToken = null;
    this.cookieJar = new CookieJar();
    this.realtimeConnected = false;
  }

  /**
   * Generate headers for API requests
   * @returns {Object} Request headers
   */
  getHeaders() {
    return {
      'User-Agent': this.userAgent,
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'X-IG-App-ID': '1217981644879628',
      'X-IG-Capabilities': '3brTvw==',
      'X-IG-Connection-Type': 'WIFI',
      'X-IG-Bandwidth-Total-Bytes-B': '0',
      'X-IG-Bandwidth-Total-Time-MS': '0',
      'X-Pigeon-Session-Id': `UFS-${this.uuid || generateUUID()}-1`,
      'X-Pigeon-Rawclienttime': (Date.now() / 1000).toFixed(3),
      'X-CSRFToken': this.csrfToken || '',
      'Cookie': this.getCookieString()
    };
  }

  /**
   * Clone session for parallel operations
   * @returns {Session} Cloned session
   */
  clone() {
    const cloned = new Session(this.options);
    cloned.loadAppState(this.getAppState());
    cloned.userId = this.userId;
    cloned.username = this.username;
    cloned.userAgent = this.userAgent;
    cloned.deviceId = this.deviceId;
    cloned.uuid = this.uuid;
    cloned.csrfToken = this.csrfToken;
    cloned.isLoggedIn = this.isLoggedIn;
    return cloned;
  }
}

module.exports = Session;
