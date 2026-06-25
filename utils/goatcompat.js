'use strict';

/**
 * GoatBot V2 Compatibility Bridge
 *
 * createUtils()  — builds the global.utils shim every GoatBot V2 command
 *                  expects to find on global.utils at module-load time.
 *
 * buildGoatV2Params() — builds the full onStart() param object so the
 *                       existing commands run inside the new architecture.
 */

const path   = require('path');
const fs     = require('fs');
const axios  = require('axios');
const config = require('../config');

// ── createUtils ────────────────────────────────────────────────────────────

function createUtils() {
  let moment = null;
  try { moment = require('moment-timezone'); } catch (_) {}

  // ── helpers ──────────────────────────────────────────────────────────────
  const getTime = (format, timestamp, timezone) => {
    if (!moment) return new Date(timestamp || Date.now()).toLocaleString();
    const tz = timezone || config.TIMEZONE || 'Asia/Dhaka';
    return moment(timestamp || Date.now()).tz(tz).format(format || 'HH:mm:ss DD/MM/YYYY');
  };

  const convertTime = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h % 24 > 0) parts.push(`${h % 24}h`);
    if (m % 60 > 0) parts.push(`${m % 60}m`);
    if (s % 60 > 0 || parts.length === 0) parts.push(`${s % 60}s`);
    return parts.join(' ');
  };

  const randomString = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ── prefix ───────────────────────────────────────────────────────────────
  const getPrefix = (threadID) => {
    try {
      const database = require('./database');
      const td = database.getThreadData(String(threadID || ''));
      return td?.prefix || config.PREFIX || '/';
    } catch (_) { return config.PREFIX || '/'; }
  };

  // ── stream helpers ────────────────────────────────────────────────────────
  const getStreamFromURL = async (url, nameFile, options = {}) => {
    const { Readable } = require('stream');
    try {
      const res = await axios.get(url, { responseType: 'stream', timeout: 30000, ...options });
      const stream = res.data;
      if (nameFile) stream.path = nameFile;
      return stream;
    } catch (err) {
      throw new Error(`getStreamFromURL failed for ${url}: ${err.message}`);
    }
  };

  const getStreamFromFile = (filePath) => {
    return fs.createReadStream(filePath);
  };

  const getStreamsFromAttachment = async (attachments = []) => {
    const streams = [];
    for (const att of attachments) {
      try {
        const url = att.url || att.playbackUrl || att.previewUrl || '';
        if (!url) continue;
        const stream = await getStreamFromURL(url, att.filename || att.name || 'attachment');
        streams.push(stream);
      } catch (_) {}
    }
    return streams;
  };

  // ── URL / file helpers ────────────────────────────────────────────────────
  const getExtFromUrl = (url) => {
    try {
      const u = new URL(url);
      const p = u.pathname;
      const ext = path.extname(p);
      return ext ? ext.slice(1).toLowerCase() : 'jpg';
    } catch (_) {
      const match = url.match(/\.([a-z0-9]{2,5})(\?|$)/i);
      return match ? match[1].toLowerCase() : 'jpg';
    }
  };

  const getBase64FromUrl = async (url) => {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    return Buffer.from(res.data).toString('base64');
  };

  // ── UID finder ────────────────────────────────────────────────────────────
  const findUid = async (url) => {
    try {
      // Try to extract username from URL
      const match = url.match(/instagram\.com\/([^/?]+)/);
      if (!match) return null;
      const username = match[1];
      const res = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-IG-App-ID': '936619743392459'
        },
        timeout: 10000
      });
      return res.data?.data?.user?.id || null;
    } catch (_) { return null; }
  };

  // ── Google Drive stub (not functional without credentials) ────────────────
  const drive = {
    upload: async (filePath, _opts = {}) => {
      return { webViewLink: `file://${filePath}`, id: randomString(16) };
    },
    uploadFromUrl: async (url, _opts = {}) => {
      return { webViewLink: url, id: randomString(16) };
    },
    deleteFile: async (_fileId) => true
  };

  // ── GoatBot API stub ──────────────────────────────────────────────────────
  const GoatBotApis = async (method, params = {}) => {
    try {
      const apiKey = (() => {
        try { return require('../configCommands.json').envGlobal?.goatbotApikey || ''; } catch (_) { return ''; }
      })();
      if (!apiKey) throw new Error('GoatBot API key not configured in configCommands.json');
      const res = await axios.get(`https://goatbot.tk/api/${method}`, {
        params: { ...params, apikey: apiKey },
        timeout: 15000
      });
      return res.data;
    } catch (err) {
      throw new Error(`GoatBotApis.${method} failed: ${err.message}`);
    }
  };

  // ── Number / string formatting ─────────────────────────────────────────────
  const formatNumber = (num) => Number(num).toLocaleString();

  const formatNumberK = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return String(num);
  };

  const getText = (langPack, key, ...args) => {
    try {
      let text = langPack?.[key] ?? key;
      args.forEach((arg, i) => { text = text.replace(new RegExp(`%${i + 1}`, 'g'), arg); });
      return text;
    } catch (_) { return key; }
  };

  // ── Uploader stub (imgbb) ─────────────────────────────────────────────────
  const uploadImgbb = async (imagePath) => {
    try {
      const apiKey = '5b026bcd47085c93b2e43e1f4c7c0059';
      const FormData = require('form-data');
      const form = new FormData();
      if (imagePath.startsWith('http')) {
        form.append('image', imagePath);
      } else {
        form.append('image', fs.createReadStream(imagePath));
      }
      const res = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, form, {
        headers: form.getHeaders(),
        timeout: 30000
      });
      return res.data?.data?.url || '';
    } catch (_) { return ''; }
  };

  // ── Zippyshare stub ──────────────────────────────────────────────────────
  const uploadZippyshare = async (filePath) => `file://${filePath}`;

  // ── Backoff helper ────────────────────────────────────────────────────────
  const withBackoff = async (fn, maxRetries = 3) => {
    let last;
    for (let i = 0; i < maxRetries; i++) {
      try { return await fn(); } catch (e) {
        last = e;
        await sleep(Math.pow(2, i) * 1000);
      }
    }
    throw last;
  };

  // ── Colors ────────────────────────────────────────────────────────────────
  const colors = {
    gray:    (s) => `\x1b[90m${s}\x1b[0m`,
    green:   (s) => `\x1b[32m${s}\x1b[0m`,
    red:     (s) => `\x1b[31m${s}\x1b[0m`,
    yellow:  (s) => `\x1b[33m${s}\x1b[0m`,
    cyan:    (s) => `\x1b[36m${s}\x1b[0m`,
    white:   (s) => `\x1b[37m${s}\x1b[0m`,
    blue:    (s) => `\x1b[34m${s}\x1b[0m`,
    magenta: (s) => `\x1b[35m${s}\x1b[0m`,
    bold:    (s) => `\x1b[1m${s}\x1b[0m`,
  };

  // ── log helper ────────────────────────────────────────────────────────────
  const log = require('./logger');

  // ── Assembled utils object ────────────────────────────────────────────────
  return {
    // Core
    getPrefix,
    getTime,
    convertTime,
    randomString,
    sleep,
    formatNumber,
    formatNumberK,
    getText,
    colors,
    log,

    // Streams
    getStreamFromURL,
    getStreamFromFile,
    getStreamsFromAttachment,

    // File / URL
    getExtFromUrl,
    getBase64FromUrl,
    findUid,

    // Uploaders
    drive,
    GoatBotApis,
    uploadImgbb,
    uploadZippyshare,

    // Compat
    withBackoff,

    // Extra aliases old commands use
    getStream: getStreamFromURL,
    getStreamURL: getStreamFromURL,
    downloadFile: async (url, dest) => {
      const writer = fs.createWriteStream(dest);
      const res = await axios.get(url, { responseType: 'stream', timeout: 30000 });
      res.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    },
    checkUrl: async (url) => {
      try { await axios.head(url, { timeout: 5000 }); return true; } catch (_) { return false; }
    },

    // ── Alias shims for old GoatBot V2 API ──────────────────────────────────
    // Some commands do: const { utils } = global; then utils.sendMessage(...)
    // Those are handled by the command dispatcher, not here. We only need
    // static helpers that commands pull at load time.
  };
}

// ── buildGoatV2Params ──────────────────────────────────────────────────────

function buildGoatV2Params({ bot, event, args, commandName, command }) {
  const cfg        = require('../config');
  const database   = require('./database');
  const logger     = require('./logger');
  const PermMgr    = require('./permissions');
  const utils      = global.utils || createUtils();

  const threadID = event.threadID || event.threadId;
  const senderID = event.senderID || event.senderId;
  const api      = bot.api;

  // ── message object ────────────────────────────────────────────────────────
  const message = {
    reply: async (text) => {
      try {
        const mid = event.messageID || event.messageId;
        if (mid) return await api.replyToMessage(threadID, text, mid);
        return await api.sendMessage(text, threadID);
      } catch (_) { return await api.sendMessage(text, threadID); }
    },
    send:   async (text) => api.sendMessage(text, threadID),
    unsend: async (mid)  => api.unsendMessage(threadID, mid),
    react:  async (emoji, mid) => api.sendReaction(emoji, mid || event.messageID)
  };

  // ── threadsData ───────────────────────────────────────────────────────────
  const threadsData = {
    get: async (tid) => {
      const d = database.getThreadData(String(tid || threadID));
      return { threadID: String(tid || threadID), ...d, data: d.data || {} };
    },
    set: async (tid, field, value) => {
      const d = database.getThreadData(String(tid || threadID));
      if (typeof field === 'string') {
        if (!d.data) d.data = {};
        d.data[field] = value;
        database.setThreadData(String(tid || threadID), d);
      } else if (typeof field === 'object') {
        database.setThreadData(String(tid || threadID), field);
      }
    },
    remove: async (tid) => database.deleteThreadData(String(tid || threadID)),
    getAll: async () => Object.values(database.data.threads)
  };

  // ── usersData ─────────────────────────────────────────────────────────────
  const usersData = {
    get: async (uid) => {
      const d = database.getUser(String(uid || senderID));
      return { userID: String(uid || senderID), ...d, data: d.data || {} };
    },
    set: async (uid, field, value) => {
      if (typeof field === 'string') {
        const d = database.getUser(String(uid || senderID));
        if (!d.data) d.data = {};
        d.data[field] = value;
        database.updateUser(String(uid || senderID), d);
      } else if (typeof field === 'object') {
        database.updateUser(String(uid || senderID), field);
      }
    },
    getAll: async () => Object.values(database.data.users)
  };

  // ── getLang ───────────────────────────────────────────────────────────────
  const lang = command?.langs?.[cfg.LANGUAGE] || command?.langs?.en || {};
  const getLang = (key, ...args) => {
    let text = lang[key];
    if (text === undefined) return key;
    args.forEach((arg, i) => { text = text.replace(new RegExp(`%${i + 1}`, 'g'), arg); });
    return text;
  };

  const role = PermMgr.getUserRole(senderID);

  return {
    api,
    event:   { ...event, threadID, senderID, body: event.body || '', args },
    args,
    message,
    threadsData,
    usersData,
    dashBoardData:  null,
    globalData:     null,
    threadModel:    null,
    userModel:      null,
    dashBoardModel: null,
    globalModel:    null,
    getLang,
    role,
    commandName: commandName || command?.config?.name || '',
    envCommands: global.GoatBot?.envCommands || {},
    envConfig:   command?.config?.envConfig  || {},
    GoatBot:     global.GoatBot,
    db:          global.db,
    client:      global.client,
    utils,
    logger,
    database,
    bot,
    config: cfg._raw || cfg
  };
}

module.exports = { createUtils, buildGoatV2Params };
