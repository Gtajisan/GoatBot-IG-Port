
const chalk = require('chalk');
const moment = require('moment-timezone');

const config = require('../config.json');

class Logger {
    constructor() {
        this.timezone = config.timezone || 'UTC';
    }
    
    getTimestamp() {
        return moment().tz(this.timezone).format('YYYY-MM-DD HH:mm:ss');
    }
    
    info(message, ...args) {
        console.log(chalk.blue(`[${this.getTimestamp()}] [INFO]`), message, ...args);
    }
    
    success(message, ...args) {
        console.log(chalk.green(`[${this.getTimestamp()}] [SUCCESS]`), message, ...args);
    }
    
    warn(message, ...args) {
        console.log(chalk.yellow(`[${this.getTimestamp()}] [WARN]`), message, ...args);
    }
    
    error(message, ...args) {
        console.log(chalk.red(`[${this.getTimestamp()}] [ERROR]`), message, ...args);
    }
    
    debug(message, ...args) {
        if (process.env.DEBUG) {
            console.log(chalk.gray(`[${this.getTimestamp()}] [DEBUG]`), message, ...args);
        }
    }
}

module.exports = new Logger();
