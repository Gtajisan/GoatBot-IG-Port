
import dotenv from 'dotenv';
dotenv.config();

export class PermissionManager {
  constructor() {
    this.adminIds = this.parseAdminIds();
    this.whitelist = this.parseList('THREAD_WHITELIST');
    this.blacklist = this.parseList('THREAD_BLACKLIST');
  }

  parseAdminIds() {
    try {
      return JSON.parse(process.env.ADMIN_IDS || '[]');
    } catch {
      return [];
    }
  }

  parseList(envVar) {
    try {
      return JSON.parse(process.env[envVar] || '[]');
    } catch {
      return [];
    }
  }

  checkPermission(userId, threadId, requiredRole = 0) {
    // Role 0: Everyone
    // Role 1: Group admins only
    // Role 2: Bot admins only

    // Check blacklist
    if (this.blacklist.includes(threadId)) {
      return false;
    }

    // Check whitelist (if enabled)
    if (this.whitelist.length > 0 && !this.whitelist.includes(threadId)) {
      return false;
    }

    // Bot admin check
    if (requiredRole === 2) {
      return this.adminIds.includes(userId);
    }

    // Group admin check would require additional IG API calls
    if (requiredRole === 1) {
      return true; // Simplified for now
    }

    return true;
  }

  isAdmin(userId) {
    return this.adminIds.includes(userId);
  }
}
