const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { colors } = require('../func/colors.js');

const logDir = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
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
const webhookUrl = config.logging?.webhookUrl || process.env.LOG_WEBHOOK_URL;

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
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, tag, ...meta }) => {
        const levelColor = levelColors[level];
        const boldColorizer = (colors.bold && colors.bold[levelColor]) ? colors.bold[levelColor] : (text => text);

        const tagStr = tag ? boldColorizer(`[${tag}]`) : '';
        const levelStr = boldColorizer(level.toUpperCase().padEnd(7));

        // Only include non-internal metadata
        const metaEntries = Object.entries(meta).filter(([key]) => !['timestamp', 'level', 'tag'].includes(key));
        const metaStr = metaEntries.length ? `\n${colors.gray(JSON.stringify(Object.fromEntries(metaEntries), null, 2))}` : '';

        return `${colors.gray(timestamp)} ${levelStr} ${tagStr} ${message}${metaStr}`;
    })
);

// Custom format for file (JSON)
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Custom transport for Webhook
class WebhookTransport extends winston.Transport {
    constructor(opts) {
        super(opts);
        this.url = opts.url;
    }

    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        if (this.url) {
            axios.post(this.url, info).catch(() => {});
        }

        callback();
    }
}

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
            filename: path.join(logDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: config.logging?.maxSize || '20m',
            maxFiles: config.logging?.maxFiles || '14d',
            format: fileFormat,
        }),
        new winston.transports.DailyRotateFile({
            level: 'error',
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: config.logging?.maxSize || '20m',
            maxFiles: config.logging?.maxFiles || '14d',
            format: fileFormat,
        })
    );
}

if (webhookUrl) {
    transports.push(new WebhookTransport({
        level: 'warn', // Only send warns and errors to webhook by default
        url: webhookUrl
    }));
}

const logger = winston.createLogger({
    levels,
    transports,
});

module.exports = logger;
