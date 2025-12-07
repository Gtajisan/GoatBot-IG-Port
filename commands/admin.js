
export default {
  config: {
    name: 'admin',
    aliases: ['botadmin'],
    description: 'Admin-only command example',
    usage: '',
    cooldown: 3,
    role: 2
  },

  async run({ api, event, bot }) {
    const user = await api.getUserInfo(event.senderID);
    
    return api.sendMessage(`✅ Admin verified: ${user.username}`);
  }
};
