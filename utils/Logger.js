
import chalk from 'chalk';
import moment from 'moment';

export class Logger {
  static getTimestamp() {
    return chalk.gray(`[${moment().format('HH:mm:ss')}]`);
  }

  static info(message, ...args) {
    console.log(this.getTimestamp(), chalk.blue('ℹ'), message, ...args);
  }

  static success(message, ...args) {
    console.log(this.getTimestamp(), chalk.green('✓'), message, ...args);
  }

  static warn(message, ...args) {
    console.log(this.getTimestamp(), chalk.yellow('⚠'), message, ...args);
  }

  static error(message, ...args) {
    console.error(this.getTimestamp(), chalk.red('✖'), message, ...args);
  }

  static debug(message, ...args) {
    if (process.env.DEBUG_MODE === 'true') {
      console.log(this.getTimestamp(), chalk.magenta('🐛'), message, ...args);
    }
  }

  static command(commandName, user) {
    console.log(
      this.getTimestamp(),
      chalk.cyan('⚡'),
      `Command: ${chalk.bold(commandName)} by ${chalk.bold(user)}`
    );
  }
}
