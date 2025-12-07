
import { IgApiClient } from 'instagram-private-api';
import dotenv from 'dotenv';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CommandHandler } from './core/CommandHandler.js';
import { EventNormalizer } from './core/EventNormalizer.js';
import { SessionManager } from './core/SessionManager.js';
import { Logger } from './utils/Logger.js';
import { setupWebServer } from './server/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class InstagramBot {
  constructor() {
    this.ig = new IgApiClient();
    this.commandHandler = new CommandHandler(this);
    this.eventNormalizer = new EventNormalizer(this);
    this.sessionManager = new SessionManager(this.ig);
    this.isRunning = false;
  }

  async start() {
    try {
      Logger.info('🚀 Starting Instagram GoatBot...');
      
      // Load session or login
      const loggedIn = await this.sessionManager.loadOrLogin(
        process.env.IG_USERNAME,
        process.env.IG_PASSWORD
      );

      if (!loggedIn) {
        Logger.error('Failed to login');
        process.exit(1);
      }

      // Load commands
      await this.commandHandler.loadCommands();
      Logger.success(`✅ Loaded ${this.commandHandler.commands.size} commands`);

      // Start listening to messages
      await this.startMessageListener();

      // Setup web server for health checks
      setupWebServer(this);

      this.isRunning = true;
      Logger.success('🎉 Bot is now running!');
      
    } catch (error) {
      Logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  async startMessageListener() {
    // Instagram's realtime API
    const inbox = this.ig.feed.directInbox();
    
    Logger.info('👂 Listening for messages...');

    // Poll for new messages
    setInterval(async () => {
      try {
        const threads = await inbox.items();
        
        for (const thread of threads) {
          const messages = thread.items || [];
          
          for (const message of messages) {
            // Skip if message is from bot
            if (message.user_id === this.ig.state.cookieUserId) continue;
            
            // Normalize event
            const event = await this.eventNormalizer.normalizeMessage(message, thread);
            
            // Handle command
            if (event.body.startsWith(process.env.BOT_PREFIX || '/')) {
              await this.commandHandler.handleCommand(event);
            }
          }
        }
      } catch (error) {
        if (process.env.DEBUG_MODE === 'true') {
          Logger.error('Message polling error:', error);
        }
      }
    }, 3000); // Poll every 3 seconds
  }

  async sendMessage(threadId, message, options = {}) {
    try {
      const thread = this.ig.entity.directThread(threadId);
      
      if (options.attachment) {
        // Handle media attachments
        if (options.attachment.type === 'photo') {
          return await thread.broadcastPhoto({ file: options.attachment.url });
        } else if (options.attachment.type === 'video') {
          return await thread.broadcastVideo({ video: options.attachment.url });
        }
      }
      
      return await thread.broadcastText(message);
    } catch (error) {
      Logger.error('Send message error:', error);
      throw error;
    }
  }

  async react(threadId, messageId, emoji) {
    try {
      const thread = this.ig.entity.directThread(threadId);
      await thread.broadcastReaction({ itemId: messageId, reaction: emoji });
    } catch (error) {
      Logger.error('React error:', error);
    }
  }
}

// Start bot
const bot = new InstagramBot();
bot.start().catch(error => {
  Logger.error('Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  Logger.info('Shutting down gracefully...');
  process.exit(0);
});

export default bot;
