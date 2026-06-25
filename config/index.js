'use strict';

const dotenv = require('dotenv');
const fs     = require('fs');
const path   = require('path');

dotenv.config();

// ── Load config files ─────────────────────────────────────────────────
// Priority: config/default.json (new) merges over config_goatbot_v2.json (legacy)
function loadJSON(filePath) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) { console.error('[config] Failed to parse', filePath, e.message); }
  return {};
}

const legacyPath  = path.resolve(__dirname, '../config_goatbot_v2.json');
const defaultPath = path.resolve(__dirname, 'default.json');

const legacy  = loadJSON(legacyPath);   // old GoatBot V2 config
const dflt    = loadJSON(defaultPath);  // new config/default.json

// Merged: default.json values win when both define the same key
const c = Object.assign({}, legacy, dflt);

const pkg = (() => { try { return require('../package.json'); } catch (_) { return {}; } })();

// ── Paths (always absolute so require() from any dir works) ────────────
const ROOT        = path.resolve(__dirname, '..');
const STORAGE_DIR = path.join(ROOT, 'storage');
const LOGS_DIR    = path.join(STORAGE_DIR, 'logs');
const DATA_DIR    = path.join(STORAGE_DIR, 'data');
const TEMP_DIR    = path.join(ROOT, 'temp');

// Ensure storage dirs exist at require-time so logger never crashes
[LOGS_DIR, DATA_DIR, TEMP_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── Exports ────────────────────────────────────────────────────────────
const config = {
  BOT_NAME:    c.nickNameBot || 'GoatBot-IG',
  BOT_VERSION: pkg.version   || '1.5.35',
  AUTHOR:      pkg.author    || 'Gtajisan',

  // Account / login
  ACCOUNT_EMAIL:       process.env.IG_USERNAME   || process.env.ACCOUNT_EMAIL    || c.instagramAccount?.email    || '',
  ACCOUNT_PASSWORD:    process.env.IG_PASSWORD   || process.env.ACCOUNT_PASSWORD || c.instagramAccount?.password || '',
  ACCOUNT_2FA_SECRET:  c.instagramAccount?.['2FASecret'] || process.env.IG_2FA_SECRET || '',
  ACCOUNT_I_USER:      c.instagramAccount?.i_user || '',
  ACCOUNT_PROXY:       c.instagramAccount?.proxy  || null,
  ACCOUNT_USER_AGENT:  c.instagramAccount?.userAgent ||
    'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  INTERVAL_GET_NEW_COOKIE: c.instagramAccount?.intervalGetNewCookie ?? 1440,
  ACCOUNT_FILE: process.env.ACCOUNT_FILE || path.join(ROOT, 'account.txt'),

  // Bot behaviour
  ANTI_INBOX:   c.antiInbox  ?? false,
  LANGUAGE:     c.language   || 'en',
  NICK_NAME_BOT: c.nickNameBot || 'GoatBot-IG',
  PREFIX:       process.env.PREFIX || c.prefix || '/',
  NO_PREFIX:    c.noPrefix   ?? false,

  // Admin / roles
  ADMIN_ONLY_ENABLE:          c.adminOnly?.enable ?? false,
  ADMIN_ONLY_IGNORE_COMMANDS: c.adminOnly?.ignoreCommand || [],
  ADMIN_BOT:     (c.adminBot     || []).map(String),
  PREMIUM_USERS: (c.premiumUsers || []).map(String),
  DEV_USERS:     (c.devUsers     || []).map(String),

  // Whitelist
  WHITELIST_ENABLE:        c.whiteListMode?.enable ?? false,
  WHITELIST_IDS:           (c.whiteListMode?.whiteListIds || []).map(String),
  WHITELIST_THREAD_ENABLE: c.whiteListModeThread?.enable ?? false,
  WHITELIST_THREAD_IDS:    (c.whiteListModeThread?.whiteListThreadIds || []).map(String),

  // Database
  DATABASE_TYPE:            process.env.DATABASE_TYPE || c.database?.type     || 'json',
  MONGODB_URI:              process.env.MONGODB_URI   || c.database?.uriMongodb || '',
  MONGODB_DATABASE:         process.env.MONGODB_DATABASE || 'instagram_bot',
  DB_AUTO_SYNC_WHEN_START:  c.database?.autoSyncWhenStart ?? false,
  DB_AUTO_REFRESH_THREAD:   c.database?.autoRefreshThreadInfoFirstTime ?? true,
  DATABASE_PATH:            path.join(DATA_DIR, 'database.json'),
  DATABASE_AUTO_SAVE:       c.database?.autoSave ?? true,
  DATABASE_SAVE_INTERVAL:   (c.database?.saveIntervalMinutes ?? 1) * 60 * 1000,

  // Timezone / locale
  TIMEZONE: process.env.TZ || c.timeZone || 'Asia/Dhaka',

  // Dashboard
  DASHBOARD_ENABLE:      c.dashBoard?.enable ?? true,
  DASHBOARD_EXPIRE_CODE: c.dashBoard?.expireVerifyCode ?? 300000,
  DASHBOARD_PORT:        parseInt(process.env.PORT || c.dashBoard?.port || 3000, 10),

  // Server uptime
  SERVER_UPTIME_ENABLE: c.serverUptime?.enable ?? false,
  SERVER_UPTIME_PORT:   c.serverUptime?.port   ?? 3000,
  SERVER_UPTIME_SOCKET: c.serverUptime?.socket || {},

  // Spam protection
  SPAM_COMMAND_THRESHOLD: c.spamProtection?.commandThreshold ?? 8,
  SPAM_TIME_WINDOW:       c.spamProtection?.timeWindow       ?? 10,
  SPAM_BAN_DURATION:      c.spamProtection?.banDuration      ?? 24,

  // Auto behaviours
  AUTO_RESTART_TIME:            c.autoRestart?.time || null,
  AUTO_UPTIME_ENABLE:           c.autoUptime?.enable ?? false,
  AUTO_UPTIME_INTERVAL:         c.autoUptime?.timeInterval ?? 180,
  AUTO_UPTIME_URL:              c.autoUptime?.url || '',
  AUTO_LOAD_SCRIPTS_ENABLE:     c.autoLoadScripts?.enable ?? false,
  AUTO_LOAD_IGNORE_CMDS:        c.autoLoadScripts?.ignoreCmds || '',
  AUTO_LOAD_IGNORE_EVENTS:      c.autoLoadScripts?.ignoreEvents || '',
  AUTO_REFRESH_FBSTATE:         c.autoRefreshFbstate ?? true,
  AUTO_RELOGIN_WHEN_CHANGE:     c.autoReloginWhenChangeAccount ?? false,
  AUTO_RESTART_WHEN_MQTT_ERROR: c.autoRestartWhenListenMqttError ?? false,
  AUTO_RECONNECT:               true,
  MAX_RECONNECT_ATTEMPTS:       5,

  // MQTT restart
  RESTART_LISTEN_MQTT: {
    enable:                  c.restartListenMqtt?.enable ?? true,
    timeRestart:             c.restartListenMqtt?.timeRestart ?? 3600000,
    delayAfterStopListening: c.restartListenMqtt?.delayAfterStopListening ?? 2000,
    logNoti:                 c.restartListenMqtt?.logNoti ?? true
  },

  // Notifications
  NOTI_MQTT_ERROR: {
    telegram:    c.notiWhenListenMqttError?.telegram    || { enable: false, botToken: '', chatId: '' },
    discordHook: c.notiWhenListenMqttError?.discordHook || { enable: false, webhookUrl: '' }
  },

  // UI / notifications
  HIDE_NOTI: {
    commandNotFound:            c.hideNotiMessage?.commandNotFound            ?? false,
    adminOnly:                  c.hideNotiMessage?.adminOnly                  ?? false,
    threadBanned:               c.hideNotiMessage?.threadBanned               ?? false,
    userBanned:                 c.hideNotiMessage?.userBanned                 ?? false,
    needRoleToUseCmd:           c.hideNotiMessage?.needRoleToUseCmd           ?? false,
    needRoleToUseCmdOnReply:    c.hideNotiMessage?.needRoleToUseCmdOnReply    ?? false,
    needRoleToUseCmdOnReaction: c.hideNotiMessage?.needRoleToUseCmdOnReaction ?? false
  },

  LOG_EVENTS: {
    disableAll:       c.logEvents?.disableAll       ?? false,
    message:          c.logEvents?.message          ?? true,
    message_reaction: c.logEvents?.message_reaction ?? true,
    message_unsend:   c.logEvents?.message_unsend   ?? true,
    message_reply:    c.logEvents?.message_reply    ?? true,
    event:            c.logEvents?.event            ?? true,
    read_receipt:     c.logEvents?.read_receipt     ?? false,
    typ:              c.logEvents?.typ              ?? false,
    presence:         c.logEvents?.presence         ?? false
  },

  // Typing
  TYPING_INDICATOR:          c.typingIndicator?.enable   ?? true,
  TYPING_INDICATOR_DURATION: c.typingIndicator?.duration ?? 500,

  // FCA / ig-chat-api options (kept for compat)
  OPTIONS_FCA: (() => {
    const o = c.optionsFca || {};
    const clean = {};
    for (const [k, v] of Object.entries(o)) { if (k !== 'notes') clean[k] = v; }
    return clean;
  })(),

  // Instagram polling delays (used by ig-chat-api/src/listenMqtt.js)
  INSTAGRAM_POLLING: c.instagramPolling || { minDelay: 5000, maxDelay: 120000, initialDelay: 5000 },

  // Human delay (used in some commands)
  HUMAN_DELAY: c.humanDelay || { enable: true, min: 500, max: 2000, typingIndicator: true },

  // AI fallback
  AI_FALLBACK: c.aiFallback || { enable: false, command: 'gpt' },

  // Absolute paths
  COMMANDS_PATH: path.join(ROOT, 'commands'),
  EVENTS_PATH:   path.join(ROOT, 'events'),
  LOGS_PATH:     LOGS_DIR,
  DATA_PATH:     DATA_DIR,
  TEMP_PATH:     TEMP_DIR,
  ROOT_PATH:     ROOT,

  // Logging
  LOG_LEVEL:              process.env.LOG_LEVEL || c.logging?.logLevel || 'info',
  ENABLE_FILE_LOGGING:    true,
  ENABLE_CONSOLE_LOGGING: true,

  // Misc
  MESSAGE_DELAY_MS: c.messageDelayMs || c.humanDelay?.min || 100,
  SESSION_SECRET:   process.env.SESSION_SECRET || 'goatbot_ig_secret',

  // Legacy paths (for old dashboard / commands that read these keys)
  dirConfig:         legacyPath,
  dirConfigCommands: path.join(ROOT, 'configCommands.json'),
  dirAccount:        path.join(ROOT, 'account.txt'),

  // Raw merged config (for global.GoatBot.config)
  _raw: c,
  _legacy: legacy,
};

module.exports = config;
