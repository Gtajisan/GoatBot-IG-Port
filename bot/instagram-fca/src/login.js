'use strict';

/**
 * Instagram-FCA Login Module
 * Supports both appState (session cookies) and username/password login
 *
 * @author Gtajisan <ffjisan804@gmail.com>
 * @github https://github.com/Gtajisan
 */

const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const Session = require('./session');
const API = require('./api');
const { getRandomUserAgent, USER_AGENTS } = require('../lib/userAgents');
const { createHttpClient } = require('../lib/http');
const { encryptPassword, generateDeviceId } = require('../lib/crypto');
const log = require('../lib/logger');

// Instagram API endpoints
const INSTAGRAM_API = {
  BASE_URL: 'https://i.instagram.com/api/v1',
  WEB_URL: 'https://www.instagram.com',
  LOGIN: '/accounts/login/',
  LOGOUT: '/accounts/logout/',
  SYNC: '/launcher/sync/',
  QESYNC: '/qe/sync/',
  CURRENT_USER: '/accounts/current_user/',
  INBOX: '/direct_v2/inbox/',
  THREADS: '/direct_v2/threads/',
  PENDING_INBOX: '/direct_v2/pending_inbox/',
  APPROVE_PENDING: '/direct_v2/threads/{thread_id}/approve/',
  SEND_MESSAGE: '/direct_v2/threads/broadcast/text/',
  SEND_PHOTO: '/direct_v2/threads/broadcast/upload_photo/',
  SEND_VIDEO: '/direct_v2/threads/broadcast/upload_video/',
  SEND_LINK: '/direct_v2/threads/broadcast/link/',
  SEND_LIKE: '/direct_v2/threads/broadcast/like/',
  MARK_SEEN: '/direct_v2/threads/{thread_id}/items/{item_id}/seen/',
  GET_PRESENCE: '/direct_v2/get_presence/',
  USER_INFO: '/users/{user_id}/info/',
  USER_SEARCH: '/users/search/',
  FRIENDSHIP: '/friendships/show/{user_id}/',
  FOLLOW: '/friendships/create/{user_id}/',
  UNFOLLOW: '/friendships/destroy/{user_id}/',
  BLOCK: '/friendships/block/{user_id}/',
  UNBLOCK: '/friendships/unblock/{user_id}/',
  TIMELINE: '/feed/timeline/',
  USER_FEED: '/feed/user/{user_id}/',
  STORY_FEED: '/feed/reels_tray/',
  STORY_MEDIA: '/feed/user/{user_id}/story/',
  LIKE_MEDIA: '/media/{media_id}/like/',
  UNLIKE_MEDIA: '/media/{media_id}/unlike/',
  SAVE_MEDIA: '/media/{media_id}/save/',
  UNSAVE_MEDIA: '/media/{media_id}/unsave/',
  COMMENT: '/media/{media_id}/comment/',
  DELETE_COMMENT: '/media/{media_id}/comment/{comment_id}/delete/',
  REALTIME: '/push/register/'
};

// Default device settings (Android)
const DEFAULT_DEVICE = {
  manufacturer: 'samsung',
  model: 'SM-G998B',
  android_version: 31,
  android_release: '12',
  dpi: '560dpi',
  resolution: '1440x3200',
  device: 'p3s'
};

/**
 * Main login function
 * @param {Object} credentials - Login credentials
 * @param {Object} options - Configuration options
 * @returns {Promise<API>} API instance
 */
async function login(credentials, options = {}) {
  log.info('Instagram-FCA v1.0.0 - Starting login...');

  // Validate credentials
  if (!credentials) {
    throw new Error('Credentials are required');
  }

  const hasAppState = credentials.appState && Array.isArray(credentials.appState) && credentials.appState.length > 0;
  const hasCredentials = credentials.username && credentials.password;

  if (!hasAppState && !hasCredentials) {
    throw new Error('Either appState or username/password is required');
  }

  // Initialize session
  const session = new Session(options);

  // Set user agent
  if (options.randomUserAgent) {
    session.userAgent = getRandomUserAgent();
    log.info(`Using random user agent: ${session.userAgent.substring(0, 50)}...`);
  } else if (options.userAgent) {
    session.userAgent = options.userAgent;
  } else {
    session.userAgent = USER_AGENTS[0];
  }

  // Setup proxy if provided
  if (options.proxy) {
    session.setProxy(options.proxy);
    log.info(`Using proxy: ${options.proxy.replace(/:[^:@]+@/, ':****@')}`);
  }

  // Create HTTP client
  const httpClient = createHttpClient(session, options);

  let loginResult;

  try {
    if (hasAppState) {
      // Login with appState (session cookies)
      log.info('Attempting login with appState...');
      loginResult = await loginWithAppState(credentials.appState, session, httpClient, options);
    } else {
      // Login with username/password
      log.info('Attempting login with username/password...');
      loginResult = await loginWithCredentials(credentials.username, credentials.password, session, httpClient, options);
    }

    if (!loginResult.success) {
      throw new Error(loginResult.error || 'Login failed');
    }

    log.info(`Login successful! User ID: ${loginResult.userId}`);

    // Create and return API instance
    const api = new API(session, httpClient, options);
    api.setCurrentUser(loginResult.userId, loginResult.username);

    // Emit ready event if enabled
    if (options.emitReady) {
      setTimeout(() => {
        api.emit('ready');
        log.info('API ready event emitted');
      }, 100);
    }

    return api;

  } catch (error) {
    log.error(`Login failed: ${error.message}`);
    throw error;
  }
}

/**
 * Login with appState (session cookies)
 * @param {Array} appState - Array of cookies
 * @param {Session} session - Session instance
 * @param {Object} httpClient - HTTP client
 * @param {Object} options - Options
 * @returns {Promise<Object>} Login result
 */
async function loginWithAppState(appState, session, httpClient, options) {
  try {
    // Load cookies into session
    session.loadAppState(appState);
    log.info(`Loaded ${appState.length} cookies from appState`);

    // Validate session by fetching current user
    const response = await httpClient.get(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.CURRENT_USER}`, {
      params: { edit: 'true' }
    });

    if (response.data && response.data.user) {
      const user = response.data.user;
      session.userId = user.pk || user.pk_id;
      session.username = user.username;
      session.isLoggedIn = true;

      // Refresh cookies
      await refreshSession(session, httpClient);

      return {
        success: true,
        userId: session.userId,
        username: session.username,
        user: user
      };
    }
console.log("DEBUG: current_user response", response.status, response.data);

    throw new Error('Invalid appState - session expired or invalid');

  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('AppState expired or invalid. Please generate new appState.');
    }
    throw error;
  }
}

/**
 * Login with username/password
 * @param {string} username - Instagram username
 * @param {string} password - Instagram password
 * @param {Session} session - Session instance
 * @param {Object} httpClient - HTTP client
 * @param {Object} options - Options
 * @returns {Promise<Object>} Login result
 */
async function loginWithCredentials(username, password, session, httpClient, options) {
  try {
    // Generate device ID
    session.deviceId = generateDeviceId(username);
    session.uuid = uuidv4();
    session.phoneId = uuidv4();
    session.advertisingId = uuidv4();

    // Step 1: Pre-login flow - sync launcher configs
    await preLoginFlow(session, httpClient);

    // Step 2: Get CSRF token
    const csrfToken = await getCsrfToken(httpClient);
    session.csrfToken = csrfToken;

    // Step 3: Encrypt password
    const encryptedPassword = await getEncryptedPassword(password, httpClient);

    // Step 4: Login request
    const loginData = {
      jazoest: generateJazoest(session.phoneId),
      country_codes: JSON.stringify([{ country_code: '1', source: 'default' }]),
      phone_id: session.phoneId,
      enc_password: encryptedPassword,
      username: username,
      adid: session.advertisingId,
      guid: session.uuid,
      device_id: session.deviceId,
      google_tokens: '[]',
      login_attempt_count: '0'
    };

    const loginResponse = await httpClient.post(
      `${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.LOGIN}`,
      new URLSearchParams(loginData).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (loginResponse.data.logged_in_user) {
      const user = loginResponse.data.logged_in_user;
      session.userId = user.pk || user.pk_id;
      session.username = user.username;
      session.isLoggedIn = true;

      // Save new appState
      const newAppState = session.getAppState();
      log.info(`Login successful! Generated new appState with ${newAppState.length} cookies`);

      // Post-login flow
      await postLoginFlow(session, httpClient);

      return {
        success: true,
        userId: session.userId,
        username: session.username,
        user: user,
        appState: newAppState
      };
    }

    // Handle 2FA
    if (loginResponse.data.two_factor_required) {
      throw new Error('Two-factor authentication required. Please use appState login or handle 2FA.');
    }

    // Handle checkpoint
    if (loginResponse.data.checkpoint_url) {
      throw new Error('Checkpoint required. Please verify your account on Instagram app and try again.');
    }

    throw new Error(loginResponse.data.message || 'Login failed - unknown error');

  } catch (error) {
    if (error.response?.data) {
      const data = error.response.data;
      if (data.two_factor_required) {
        throw new Error('Two-factor authentication required');
      }
      if (data.checkpoint_url) {
        throw new Error('Account checkpoint required - please verify on Instagram app');
      }
      if (data.message) {
        throw new Error(data.message);
      }
    }
    throw error;
  }
}

/**
 * Pre-login flow - sync configs
 */
async function preLoginFlow(session, httpClient) {
  try {
    // Sync launcher
    await httpClient.post(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.SYNC}`, {
      id: session.uuid,
      server_config_retrieval: '1'
    });

    // QE Sync
    await httpClient.post(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.QESYNC}`, {
      id: session.uuid,
      experiments: 'ig_android_fci_onboarding_friend_search,ig_android_device_detection_info_upload'
    });

  } catch (error) {
    log.warn('Pre-login flow warning:', error.message);
  }
}

/**
 * Post-login flow
 */
async function postLoginFlow(session, httpClient) {
  try {
    // Sync after login
    await httpClient.post(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.SYNC}`, {
      id: session.userId,
      _uid: session.userId,
      _uuid: session.uuid,
      server_config_retrieval: '1'
    });

  } catch (error) {
    log.warn('Post-login flow warning:', error.message);
  }
}

/**
 * Get CSRF token
 */
async function getCsrfToken(httpClient) {
  try {
    const response = await httpClient.get(INSTAGRAM_API.WEB_URL);
    const cookies = response.headers['set-cookie'] || [];

    for (const cookie of cookies) {
      const match = cookie.match(/csrftoken=([^;]+)/);
      if (match) return match[1];
    }

    // Generate random token as fallback
    return crypto.randomBytes(32).toString('hex');
  } catch (error) {
    return crypto.randomBytes(32).toString('hex');
  }
}

/**
 * Get encrypted password
 */
async function getEncryptedPassword(password, httpClient) {
  try {
    // For now, use simple encryption format
    // In production, this should use Instagram's actual encryption
    const timestamp = Math.floor(Date.now() / 1000);
    return `#PWD_INSTAGRAM:0:${timestamp}:${password}`;
  } catch (error) {
    const timestamp = Math.floor(Date.now() / 1000);
    return `#PWD_INSTAGRAM:0:${timestamp}:${password}`;
  }
}

/**
 * Generate jazoest parameter
 */
function generateJazoest(input) {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += input.charCodeAt(i);
  }
  return `2${sum}`;
}

/**
 * Refresh session to keep alive
 */
async function refreshSession(session, httpClient) {
  try {
    await httpClient.get(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.INBOX}`, {
      params: { limit: 1 }
    });
    log.debug('Session refreshed successfully');
  } catch (error) {
    log.warn('Session refresh warning:', error.message);
  }
}

module.exports = login;
module.exports.INSTAGRAM_API = INSTAGRAM_API;
