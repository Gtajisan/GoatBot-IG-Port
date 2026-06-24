const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const { colors } = require('../func/colors.js');

const logDir = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Load config to get log levels and options
let config = {};
try {
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) {
    // Fallback to defaults
}

const logLevel = config.logging?.logLevel || 'info';
const logToFile = config.logging?.logToFile !== false;

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    success: 2,
    info: 3,
    debug: 4,
};

// Define colors for each level
const levelColors = {
    error: 'red',
    warn: 'yellow',
    success: 'cyan',
    info: 'green',
    debug: 'gray',
};

// Custom format for console
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss DD/MM/YYYY' }),
    winston.format.printf(({ timestamp, level, message, tag, ...meta }) => {
        const colorizer = colors[levelColors[level]] || (text => text);
        const tagStr = tag ? colorizer(` [${tag}]`) : '';
        // Only include non-internal metadata
        const metaEntries = Object.entries(meta).filter(([key]) => !['timestamp', 'level', 'tag'].includes(key));
        const metaStr = metaEntries.length ? ` ${JSON.stringify(Object.fromEntries(metaEntries))}` : '';
        return `${colors.gray(timestamp)} ${colorizer(level.toUpperCase())}${tagStr}: ${message}${metaStr}`;
    })
);

// Custom format for file (JSON)
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

const transports = [
    new winston.transports.Console({
        level: logLevel,
        format: consoleFormat,
    })
];

if (logToFile) {
    transports.push(
        new winston.transports.DailyRotateFile({
            level: 'info',
            filename: path.join(logDir, 'application-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: fileFormat,
        }),
        new winston.transports.DailyRotateFile({
            level: 'error',
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: fileFormat,
        })
    );
}

const logger = winston.createLogger({
    levels,
    transports,
});

module.exports = logger;
