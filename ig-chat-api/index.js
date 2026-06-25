'use strict';

/**
 * ig-chat-api — Instagram Chat API
 *
 * InstaBOT-style login: cookies from account.txt first,
 * falls back to email+password login via the mobile API.
 *
 * Cookie priority order:
 *   1. Netscape cookie string (account.txt)
 *   2. Array of cookie objects { key/name, value }
 *   3. { username, password } or { email, password } — triggers passwordLogin
 */

const axios           = require('axios');
const { CookieJar }   = require('tough-cookie');
const { wrapper }     = require('axios-cookiejar-support');
const EventEmitter    = require('events');
const { passwordLogin } = require('./src/auth/passwordLogin');

const IG_APP_ID  = '936619743392459';
const MOBILE_UA  = 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

// ── Netscape cookie parser ─────────────────────────────────────────────

function parseNetscapeCookies(text) {
  const cookies = [];
  for (const rawLine of (text || '').split('\n')) {
    const line = rawLine.trim();
    if (!line || (line.startsWith('#') && !line.startsWith('#HttpOnly_'))) continue;
    const cleanLine = line.replace(/^#HttpOnly_/, '');
    const parts = cleanLine.split('\t');
    if (parts.length < 7) continue;
    cookies.push({
      key:      parts[5],
      value:    parts[6],
      domain:   parts[0].replace(/^\./, ''),
      path:     parts[2],
      secure:   parts[3] === 'TRUE',
      httpOnly: line.startsWith('#HttpOnly_'),
      expires:  parts[4] ? new Date(parseInt(parts[4], 10) * 1000) : 'Infinity'
    });
  }
  return cookies;
}

function cookiesToHeader(cookies) {
  return cookies.map(c => `${c.key || c.name}=${c.value}`).join('; ');
}

function extractCtxFromCookies(cookies) {
  const get = (name) => (cookies.find(c => (c.key || c.name) === name) || {}).value || '';
  return {
    sessionID:    get('sessionid'),
    csrfToken:    get('csrftoken'),
    userID:       get('ds_user_id') || get('igdid'),
    wwwClaim:     get('rur') || '0',
    cookieString: cookiesToHeader(cookies),
    cookies
  };
}

// ── Build HTTP client ─────────────────────────────────────────────────

function buildHttpClient(cookieString, csrfToken) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, withCredentials: true }));

  client.defaults.headers.common = {
    'User-Agent':       MOBILE_UA,
    'Accept':           '*/*',
    'Accept-Language':  'en-US,en;q=0.9',
    'X-IG-App-ID':      IG_APP_ID,
    'X-CSRFToken':      csrfToken || '',
    'X-Requested-With': 'XMLHttpRequest',
    'Cookie':           cookieString,
    'Origin':           'https://www.instagram.com',
    'Referer':          'https://www.instagram.com/direct/inbox/'
  };

  return client;
}

// ── Build the API object ───────────────────────────────────────────────

function buildAPI(ctx) {
  const globalOptions = {
    userAgent:        MOBILE_UA,
    listenEvents:     true,
    selfListen:       false,
    autoMarkDelivery: false,
    autoMarkRead:     true,
    autoReconnect:    true,
    online:           true
  };

  const httpClient = buildHttpClient(ctx.cookieString, ctx.csrfToken);
  const internalCtx = {
    ...ctx,
    globalOptions,
    _stopListen:  false,
    _httpClient:  httpClient,
    axios:        httpClient   // all src/ files reference ctx.axios
  };

  // Load src/ method factories
  const sendMessageFn      = require('./src/sendMessage')(internalCtx);
  const getCurrentUserIDFn = require('./src/getCurrentUserID')(internalCtx);
  const listenMqttFn       = require('./src/listenMqtt')(internalCtx);
  const getUserInfoFn      = require('./src/getUserInfo')(internalCtx);
  const getThreadInfoFn    = require('./src/getThreadInfo')(internalCtx);
  const getThreadListFn    = require('./src/getThreadList')(internalCtx);
  const getThreadHistoryFn = require('./src/getThreadHistory')(internalCtx);
  const markAsReadFn       = require('./src/markAsRead')(internalCtx);
  const markAsSeenFn       = require('./src/markAsSeen')(internalCtx);
  const sendTypingFn       = require('./src/sendTypingIndicator')(internalCtx);
  const setReactionFn      = require('./src/setMessageReaction')(internalCtx);
  const unsendFn           = require('./src/unsendMessage')(internalCtx);

  const api = {
    // Identity
    getCurrentUserID: getCurrentUserIDFn,
    getAppState:      () => ctx.cookies || [],

    // Core messaging
    sendMessage:         sendMessageFn,
    sendTypingIndicator: sendTypingFn,
    unsendMessage:       unsendFn,

    // Reactions
    setMessageReaction: setReactionFn,
    sendReaction:       (reaction, messageID, cb) => setReactionFn(reaction, messageID, cb),

    // User/Thread info
    getUserInfo:      getUserInfoFn,
    getThreadInfo:    getThreadInfoFn,
    getThreadList:    getThreadListFn,
    getThreadHistory: getThreadHistoryFn,

    // Read receipts
    markAsRead: markAsReadFn,
    markAsSeen: markAsSeenFn,

    // Listener
    listen: (callback) => {
      internalCtx._stopListen = false;
      return listenMqttFn(callback);
    },
    listenMqtt: (callback) => {
      internalCtx._stopListen = false;
      return listenMqttFn(callback);
    },
    stopListening: () => { internalCtx._stopListen = true; },

    // Options
    setOptions: (opts) => { Object.assign(internalCtx.globalOptions, opts); },
    getOptions: () => ({ ...internalCtx.globalOptions }),

    // Media
    sendPhoto: (threadID, photoPath) => api.sendMessage({ attachment: require('fs').createReadStream(photoPath) }, threadID),
    sendVideo: (threadID, videoPath) => api.sendMessage({ attachment: require('fs').createReadStream(videoPath) }, threadID),
    sendVoice: (threadID, audioPath) => api.sendMessage({ attachment: require('fs').createReadStream(audioPath) }, threadID),
    sendPhotoFromUrl: (threadID, url) => api.sendMessage({ url, attachment_type: 'image' }, threadID),
    sendVideoFromUrl: (threadID, url) => api.sendMessage({ url, attachment_type: 'video' }, threadID),
    sendVoiceFromUrl: (threadID, url) => api.sendMessage({ url, attachment_type: 'audio' }, threadID),
    sendDirectMessage: (userID, text) => api.sendMessage(text, userID),
    replyToMessage:    (threadID, text, replyToMessageID) => api.sendMessage({ body: text, replyToItemId: replyToMessageID }, threadID),

    // Extras
    getUserInfoByUsername: async (username) => {
      try {
        const res = await internalCtx._httpClient.get('https://www.instagram.com/api/v1/users/web_profile_info/', {
          params: { username }, headers: { 'Referer': `https://www.instagram.com/${username}/` }
        });
        return res.data?.data?.user || null;
      } catch (_) { return null; }
    },
    getInbox: async () => {
      try {
        const res = await internalCtx._httpClient.get('https://www.instagram.com/api/v1/direct_v2/inbox/', {
          params: { visual_message_return_type: 'unseen', thread_message_limit: 10, persistentBadging: true, limit: 20 }
        });
        return res.data;
      } catch (_) { return { inbox: { threads: [] } }; }
    }
  };

  return api;
}

// ── Main login function (InstaBOT-style) ──────────────────────────────

async function login(loginData, optionsOrCallback, callback) {
  if (typeof optionsOrCallback === 'function') {
    callback = optionsOrCallback;
    optionsOrCallback = {};
  }

  const execute = async () => {
    // 1. Netscape cookie string
    if (typeof loginData === 'string' && loginData.trim()) {
      const cookies = parseNetscapeCookies(loginData);
      if (!cookies.length) throw new Error('No valid cookies found in cookie string.');
      const ctx = extractCtxFromCookies(cookies);
      if (!ctx.sessionID) throw new Error('Cookie string missing "sessionid". Re-export Instagram cookies.');
      return buildAPI(ctx);
    }

    // 2. Array of cookie objects
    if (Array.isArray(loginData) && loginData.length > 0) {
      const ctx = extractCtxFromCookies(loginData);
      if (!ctx.sessionID) throw new Error('Cookie array missing "sessionid".');
      return buildAPI(ctx);
    }

    // 3. { appState } — FCA compat
    if (loginData && typeof loginData === 'object' && loginData.appState) {
      const raw = loginData.appState;
      const cookies = Array.isArray(raw) ? raw : parseNetscapeCookies(String(raw));
      const ctx = extractCtxFromCookies(cookies);
      if (!ctx.sessionID) throw new Error('appState missing "sessionid".');
      return buildAPI(ctx);
    }

    // 4. { email/username, password }
    if (loginData && typeof loginData === 'object') {
      const email    = loginData.email    || loginData.username || '';
      const password = loginData.password || '';
      if (!email || !password) throw new Error('Provide email/username + password, or valid cookies.');
      const result = await passwordLogin(email, password);
      const ctx = extractCtxFromCookies(result.appState);
      ctx.userID   = result.userID   || ctx.userID;
      ctx.username = result.username || '';
      return buildAPI(ctx);
    }

    throw new Error('Invalid loginData. Pass Netscape cookie string, cookie array, or { email, password }.');
  };

  if (typeof callback === 'function') {
    execute().then(api => callback(null, api)).catch(err => callback(err));
    return;
  }
  return execute();
}

login.setOptions          = () => {};
login.parseNetscapeCookies = parseNetscapeCookies;

module.exports          = login;
module.exports.login    = login;
