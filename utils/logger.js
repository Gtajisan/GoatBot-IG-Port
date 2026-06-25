const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const config = require('../config');

const logsPath = config.LOGS_PATH || './storage/logs';
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}

const colors = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[90m',
  success: '\x1b[32m',
  reset: '\x1b[0m',
  timestamp: '\x1b[90m',
  tag: '\x1b[1m\x1b[35m'
};

const levels = {
  error: 0,
  warn: 1,
  success: 2,
  info: 3,
  debug: 4,
};

const consoleFormat = winston.format.printf(({ level, message, timestamp, tag, ...metadata }) => {
  const icons = { error: '✗', warn: '⚠', info: '●', debug: '○', success: '✓' };
  const levelMap = { error: 'ERROR', warn: 'WARN', info: 'INFO', debug: 'DEBUG', success: 'SUCCESS' };
  const color = colors[level] || colors.info;
  const timeStr = colors.timestamp + (timestamp || new Date().toISOString()) + colors.reset;
  const tagStr = tag ? `${colors.tag}[${tag}]${colors.reset} ` : '';
  const levelStr = `${color}${icons[level] || '●'} ${(levelMap[level] || level.toUpperCase()).padEnd(7)}${colors.reset}`;

  let output = `${timeStr} ${levelStr} ${tagStr}${message}`;

  const meta = { ...metadata };
  delete meta.service; delete meta.level; delete meta.timestamp; delete meta.tag;
  if (Object.keys(meta).length > 0) {
    output += `\n${colors.debug}${JSON.stringify(meta, null, 2)}${colors.reset}`;
  }
  return output;
});

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

class WebhookTransport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.url = opts.url;
  }
  log(info, callback) {
    if (this.url) {
      const tagStr = info.tag ? `[${info.tag}] ` : '';
      axios.post(this.url, {
        content: `**[${info.level.toUpperCase()}]** ${tagStr}${info.message}`
      }).catch(() => {});
    }
    callback();
  }
}

const transports = [
  new winston.transports.Console({
    level: config.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    )
  })
];

if (config.ENABLE_FILE_LOGGING !== false) {
  transports.push(
    new winston.transports.DailyRotateFile({
      level: 'info',
      filename: path.join(logsPath, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: path.join(logsPath, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    })
  );
}

const webhookUrl = config.logging?.webhookUrl;
if (webhookUrl) {
  transports.push(new WebhookTransport({ level: 'warn', url: webhookUrl }));
}

const logger = winston.createLogger({
  levels,
  transports,
  defaultMeta: { service: 'goatbot-ig' }
});

// Helper methods for GoatBot V2 compatibility
logger.success = (message, tag, meta = {}) => {
  if (typeof tag === 'object') { meta = tag; tag = undefined; }
  logger.log({ level: 'success', message, tag, ...meta });
};

logger.info = (message, tag, meta = {}) => {
  if (typeof tag === 'object') { meta = tag; tag = undefined; }
  logger.log({ level: 'info', message, tag, ...meta });
};

logger.warn = (message, tag, meta = {}) => {
  if (typeof tag === 'object') { meta = tag; tag = undefined; }
  logger.log({ level: 'warn', message, tag, ...meta });
};

logger.error = (message, tag, meta = {}) => {
  if (typeof tag === 'object') { meta = tag; tag = undefined; }
  logger.log({ level: 'error', message, tag, ...meta });
};

logger.debug = (message, tag, meta = {}) => {
  if (typeof tag === 'object') { meta = tag; tag = undefined; }
  logger.log({ level: 'debug', message, tag, ...meta });
};

logger.err = logger.error;

module.exports = logger;
