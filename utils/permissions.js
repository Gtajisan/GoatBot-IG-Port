'use strict';

const ConfigManager = require('./configManager');
const logger = require('./logger');

class PermissionManager {
  static isGroupAdmin(userId, threadInfo) {
    if (!threadInfo) return false;
    const uid = String(userId);
    if (Array.isArray(threadInfo.adminIDs)) {
      return threadInfo.adminIDs.some(a =>
        (typeof a === 'object' ? String(a.uid || a.id || '') : String(a)) === uid
      );
    }
    if (Array.isArray(threadInfo.adminParticipants)) {
      return threadInfo.adminParticipants.some(a => String(a.userID || a.uid || a) === uid);
    }
    return false;
  }

  static getGlobalRole(userId) {
    const uid = String(userId);
    if (ConfigManager.getDevUsers().includes(uid))     return 4;
    if (ConfigManager.getAdmins().includes(uid))       return 2;
    if (ConfigManager.getPremiumUsers().includes(uid)) return 3;
    return 0;
  }

  static getUserRole(userId, threadInfo = null) {
    const globalRole = this.getGlobalRole(userId);
    if (globalRole !== 0) return globalRole;
    if (this.isGroupAdmin(userId, threadInfo)) return 1;
    return 0;
  }

  static async hasPermission(userId, requiredRole = 0, threadInfo = null) {
    if (requiredRole === 0) return true;
    const globalRole = this.getGlobalRole(userId);
    if (globalRole === 4) return true;
    switch (requiredRole) {
      case 1: return globalRole === 2 || globalRole === 3 || this.isGroupAdmin(userId, threadInfo);
      case 2: return globalRole === 2;
      case 3: return globalRole === 3 || globalRole === 2;
      case 4: return false;
      default: return false;
    }
  }

  static canUseNoPrefix(userId) {
    const role = this.getGlobalRole(userId);
    return role >= 2;
  }

  static getRoleName(role) {
    const names = { 0: 'Normal User', 1: 'Group Admin', 2: 'Bot Admin', 3: 'Premium User', 4: 'Developer' };
    return names[role] || 'Normal User';
  }
}

module.exports = PermissionManager;
