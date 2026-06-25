module.exports = {
  config: { name: 'userinfo', aliases: ['whoami', 'me'], description: 'Get info about a user', usage: 'userinfo [username]', cooldown: 5, role: 0, category: 'info' },
  async run({ api, event, args, logger, PermissionManager }) {
    try {
      const role = PermissionManager.getUserRole(event.senderID);
      let msg = `👤 User Info\n\n🆔 UID: ${event.senderID}\n🎭 Role: ${PermissionManager.getRoleName(role)} (${role})`;
      if (args[0]) {
        try {
          const info = await api.getUserInfoByUsername(args[0].replace('@', ''));
          if (info) msg = `👤 @${args[0]}\n🆔 UID: ${info.userID || info.userId || 'N/A'}`;
        } catch (_) {}
      }
      return api.sendMessage(msg, event.threadId);
    } catch (e) { logger.error('Error in userinfo', { error: e.message }); return api.sendMessage('❌ Error.', event.threadId); }
  }
};
