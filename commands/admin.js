module.exports = {
  config: { name: 'admin', aliases: ['botadmin'], description: 'Admin panel', usage: 'admin [add|remove|list] [uid]', cooldown: 5, role: 2, category: 'admin' },
  async run({ api, event, args, bot, logger, config, PermissionManager, ConfigManager }) {
    try {
      if (args.length === 0) {
        const role = PermissionManager.getUserRole(event.senderID);
        const admins = ConfigManager.getAdmins();
        let t = `👑 Admin Panel\n\n👤 Your Role: ${PermissionManager.getRoleName(role)}\n`;
        t += `👥 Admins: ${admins.length}\n📦 Commands: ${bot.commandLoader.getAllCommandNames().length}\n\n`;
        t += `📝 Commands:\n• admin list\n• admin add <uid>\n• admin remove <uid>`;
        return api.sendMessage(t, event.threadId);
      }
      const action = args[0].toLowerCase();
      if (action === 'list') {
        const admins = ConfigManager.getAdmins(), devs = ConfigManager.getDevUsers();
        let msg = `👥 Admins\n\n👨‍💻 Devs:\n${devs.map(d => `  • ${d}`).join('\n') || '  • None'}\n\n🔒 Admins:\n${admins.length ? admins.map((a,i)=>`  ${i+1}. ${a}`).join('\n') : '  • None'}`;
        return api.sendMessage(msg, event.threadId);
      }
      if (action === 'add') {
        if (!args[1]) return api.sendMessage('❌ Usage: admin add <user_id>', event.threadId);
        if (ConfigManager.isAdmin(args[1])) return api.sendMessage(`ℹ️ User ${args[1]} is already an admin.`, event.threadId);
        ConfigManager.addAdmin(args[1]);
        return api.sendMessage(`✅ Admin added: ${args[1]}`, event.threadId);
      }
      if (action === 'remove' || action === 'delete') {
        if (PermissionManager.getUserRole(event.senderID) < 4) return api.sendMessage('🔒 Only developers can remove admins.', event.threadId);
        if (!args[1]) return api.sendMessage('❌ Usage: admin remove <user_id>', event.threadId);
        if (!ConfigManager.isAdmin(args[1])) return api.sendMessage(`ℹ️ User ${args[1]} is not an admin.`, event.threadId);
        ConfigManager.removeAdmin(args[1]);
        return api.sendMessage(`✅ Admin removed: ${args[1]}`, event.threadId);
      }
      return api.sendMessage('❌ Invalid action. Use: admin list | add <uid> | remove <uid>', event.threadId);
    } catch (e) { logger.error('Error in admin', { error: e.message }); return api.sendMessage('❌ Error.', event.threadId); }
  }
};
