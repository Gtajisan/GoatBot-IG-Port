module.exports = {
  config: { name: 'uid', aliases: ['userid', 'id'], description: 'Get your UID or resolve a username', usage: 'uid [username]', cooldown: 5, role: 0, category: 'utility' },
  async run({ api, event, args, logger }) {
    if (args.length === 0) return api.sendMessage(String(event.senderID), event.threadId);
    const input = args[0].replace('@', '').trim();
    if (/^\d+$/.test(input)) return api.sendMessage(input, event.threadId);
    try {
      const info = await api.getUserInfoByUsername(input);
      if (!info) return api.sendMessage(`❌ User @${input} not found!`, event.threadId);
      const uid = info.userID || info.userId;
      if (!uid) return api.sendMessage(`❌ Could not resolve UID for @${input}.`, event.threadId);
      return api.sendMessage(String(uid), event.threadId);
    } catch (e) {
      logger.error('Error in uid', { error: e.message });
      return api.sendMessage(`❌ Error fetching UID for @${input}`, event.threadId);
    }
  }
};
