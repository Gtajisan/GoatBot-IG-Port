'use strict';

/**
 * Logger for Instagram-FCA
 * Simple logging utility with levels
 *
 * @author Gtajisan <ffjisan804@gmail.com>
 * @github https://github.com/Gtajisan
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4
};

let currentLevel = LOG_LEVELS.info;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Format timestamp
 * @returns {string} Formatted timestamp
 */
function formatTime() {
  const now = new Date();
  return now.toISOString().substring(11, 23);
}

/**
 * Set log level
 * @param {string} level - Log level
 */
function setLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    currentLevel = LOG_LEVELS[level];
  }
}

/**
 * Log debug message
 * @param {...any} args - Arguments to log
 */
function debug(...args) {
  if (currentLevel <= LOG_LEVELS.debug) {
    console.log(`${colors.gray}[${formatTime()}]${colors.reset} ${colors.cyan}[DEBUG]${colors.reset}`, ...args);
  }
}

/**
 * Log info message
 * @param {...any} args - Arguments to log
 */
function info(...args) {
  if (currentLevel <= LOG_LEVELS.info) {
    console.log(`${colors.gray}[${formatTime()}]${colors.reset} ${colors.green}[INFO]${colors.reset}`, ...args);
  }
}

/**
 * Log warning message
 * @param {...any} args - Arguments to log
 */
function warn(...args) {
  if (currentLevel <= LOG_LEVELS.warn) {
    console.log(`${colors.gray}[${formatTime()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset}`, ...args);
  }
}

/**
 * Log error message
 * @param {...any} args - Arguments to log
 */
function error(...args) {
  if (currentLevel <= LOG_LEVELS.error) {
    console.log(`${colors.gray}[${formatTime()}]${colors.reset} ${colors.red}[ERROR]${colors.reset}`, ...args);
  }
}

module.exports = {
  setLevel,
  debug,
  info,
  warn,
  error,
  LOG_LEVELS
};
