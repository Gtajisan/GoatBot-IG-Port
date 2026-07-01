const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const config = require('../config');

class EventLoader {
  constructor(bot) {
    this.bot = bot;
    this.events = new Map();
  }

  async loadAll() {
      await this.loadEvents();
  }

  async loadEvents() {
    const eventsPath = path.resolve(config.EVENTS_PATH);
    if (!fs.existsSync(eventsPath)) {
      logger.warn('Events directory not found, creating it');
      fs.mkdirSync(eventsPath, { recursive: true });
      return;
    }
    const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    logger.info(`Loading ${files.length} events...`);
    for (const file of files) {
      try {
        const fp = path.join(eventsPath, file);
        delete require.cache[require.resolve(fp)];
        const ev = require(fp);
        if (!ev.config || !ev.config.name) { logger.warn(`Event ${file} missing config.name, skipping`); continue; }
        this.events.set(ev.config.name, ev);

        // Populate GoatBot.onEvent for V2 parity
        global.GoatBot.onEvent.push(ev);

        logger.info(`Loaded event: ${ev.config.name}`);
      } catch (e) { logger.error(`Failed to load event ${file}`, { error: e.message }); }
    }
    logger.info(`Successfully loaded ${this.events.size} events`);
  }

  async handleEvent(name, data) {
    const ev = this.events.get(name);

    if (name !== 'ready' && name !== 'message') {
        for (const eventCmd of global.GoatBot.onEvent) {
            if (typeof eventCmd.onStart === 'function') {
                const database = require('./database');
                eventCmd.onStart({
                    api: this.bot.api,
                    event: data,
                    bot: this.bot,
                    database,
                    usersData: database.usersData,
                    threadsData: database.threadsData,
                    getLang: (...args) => require('../utils.js').getText(eventCmd.config.name, ...args)
                }).catch(e => logger.error(`Error in event script ${eventCmd.config.name}`, { error: e.message }));
            }
        }
    }

    if (!ev) return;
    try {
        const database = require('./database');
        await ev.run({
            api: this.bot.api,
            event: data,
            bot: this.bot,
            database,
            usersData: database.usersData,
            threadsData: database.threadsData
        });
    }
    catch (e) { logger.error(`Error handling event ${name}`, { error: e.message, stack: e.stack }); }
  }

  getAllEventNames() { return Array.from(this.events.keys()); }
}

module.exports = EventLoader;
