
import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/Logger.js';

export class SessionManager {
  constructor(ig) {
    this.ig = ig;
    this.sessionPath = path.join(process.cwd(), 'session.json');
  }

  async loadOrLogin(username, password) {
    try {
      // Try to load existing session
      if (fs.existsSync(this.sessionPath) && process.env.AUTO_SAVE_SESSION === 'true') {
        Logger.info('📂 Loading session...');
        const sessionData = JSON.parse(fs.readFileSync(this.sessionPath, 'utf-8'));
        
        await this.ig.state.deserialize(sessionData);
        
        // Verify session
        try {
          await this.ig.account.currentUser();
          Logger.success('✅ Session loaded successfully');
          return true;
        } catch {
          Logger.warn('Session expired, logging in...');
        }
      }

      // Login
      Logger.info('🔐 Logging in...');
      this.ig.state.generateDevice(username);
      
      await this.ig.account.login(username, password);
      
      Logger.success('✅ Logged in successfully');

      // Save session
      if (process.env.AUTO_SAVE_SESSION === 'true') {
        await this.saveSession();
      }

      return true;
    } catch (error) {
      Logger.error('Login error:', error);
      return false;
    }
  }

  async saveSession() {
    try {
      const serialized = await this.ig.state.serialize();
      delete serialized.constants;
      
      fs.writeFileSync(this.sessionPath, JSON.stringify(serialized, null, 2));
      Logger.success('💾 Session saved');
    } catch (error) {
      Logger.error('Session save error:', error);
    }
  }
}
