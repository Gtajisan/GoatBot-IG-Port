const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const logsPath = config.LOGS_PATH || './storage/logs';
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}

const colors = {
  error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m',
  debug: '\x1b[90m', success: '\x1b[32m', reset: '\x1b[0m'
};

const cleanConsoleFormat = winston.format.printf(({ level, message, type, ...metadata }) => {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  const icons = { error: '✗', warn: '⚠', info: '●', debug: '○', success: '✓' };
  const levelMap = { error: 'ERROR', warn: 'WARN', info: 'INFO', debug: 'DEBUG' };
  const color = colors[type] || colors[level] || colors.info;
  let output = `${colors.reset}[${timestamp}] ${color}${icons[level] || '●'} ${(levelMap[level] || level.toUpperCase()).padEnd(5)}${colors.reset}  ${message}`;
  const meta = { ...metadata };
  delete meta.service; delete meta.level; delete meta.timestamp;
  if (Object.keys(meta).length > 0) output += ` ${colors.debug}${JSON.stringify(meta)}${colors.reset}`;
  return output;
});

const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'goatbot-ig' },
  transports: [
    new winston.transports.File({ filename: path.join(logsPath, 'error.log'), level: 'error', maxsize: 5242880, maxFiles: 5 }),
    new winston.transports.File({ filename: path.join(logsPath, 'combined.log'), maxsize: 5242880, maxFiles: 5 }),
    new winston.transports.Console({ format: cleanConsoleFormat })
  ]
});

logger.success = (message, meta = {}) => logger.log({ level: 'info', type: 'success', message, ...meta });
logger.command  = (name, user, ok = true) => logger.log({ level: ok ? 'info' : 'error', type: ok ? 'success' : 'error', message: `${name} executed by ${user}` });

module.exports = logger;
