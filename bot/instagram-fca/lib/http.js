'use strict';

/**
 * HTTP Client for Instagram-FCA
 * Handles all HTTP requests with retry logic and error handling
 *
 * @author Gtajisan <ffjisan804@gmail.com>
 * @github https://github.com/Gtajisan
 */

const axios = require('axios');
const log = require('./logger');

/**
 * Create HTTP client with session support
 * @param {Session} session - Session instance
 * @param {Object} options - Options
 * @returns {Object} HTTP client
 */
function createHttpClient(session, options = {}) {
  const client = axios.create({
    timeout: options.timeout || 30000,
    maxRedirects: 5,
    validateStatus: status => status < 500
  });

  // Request interceptor
  client.interceptors.request.use(config => {
    // Add headers from session
    const headers = session.getHeaders();
    config.headers = { ...headers, ...config.headers };

    // Add proxy if configured
    if (session.proxyAgent) {
      config.httpAgent = session.proxyAgent;
      config.httpsAgent = session.proxyAgent;
    }

    // Update activity
    session.updateActivity();

    log.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  }, error => {
    session.recordError();
    return Promise.reject(error);
  });

  // Response interceptor
  client.interceptors.response.use(response => {
    // Save cookies from response
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      for (const cookie of cookies) {
        session.setCookie(cookie);
      }
    }

    // Update CSRF token if present
    const csrfCookie = cookies?.find(c => c.includes('csrftoken='));
    if (csrfCookie) {
      const match = csrfCookie.match(/csrftoken=([^;]+)/);
      if (match) session.csrfToken = match[1];
    }

    log.debug(`Response: ${response.status} ${response.config.url}`);
    return response;
  }, error => {
    session.recordError();

    if (error.response) {
      log.warn(`HTTP Error: ${error.response.status} ${error.config?.url}`);

      // Handle rate limiting
      if (error.response.status === 429) {
        log.warn('Rate limited! Please slow down requests.');
      }

      // Handle authentication errors
      if (error.response.status === 401 || error.response.status === 403) {
        log.error('Authentication error - session may be expired');
      }
    } else {
      log.error(`Network error: ${error.message}`);
    }

    return Promise.reject(error);
  });

  return client;
}

/**
 * Make request with retry logic
 * @param {Object} client - HTTP client
 * @param {Object} config - Request config
 * @param {Object} retryOptions - Retry options
 * @returns {Promise<Object>} Response
 */
async function requestWithRetry(client, config, retryOptions = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    factor = 2,
    maxDelay = 30000,
    jitter = true
  } = retryOptions;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client(config);
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except 429
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }

      if (attempt < maxRetries) {
        let delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);

        if (jitter) {
          delay = delay * (0.5 + Math.random());
        }

        log.warn(`Request failed, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Sleep helper
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  createHttpClient,
  requestWithRetry,
  sleep
};
