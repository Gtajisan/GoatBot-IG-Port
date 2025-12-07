
export default {
  config: {
    name: 'userinfo',
    aliases: ['user', 'profile'],
    description: 'Get user information',
    usage: '[@mention or user_id]',
    cooldown: 5,
    role: 0
  },

  async run({ api, event, args }) {
    let userId = event.senderID;

    if (event.mentions.length > 0) {
      userId = event.mentions[0].id;
    } else if (args.length > 0 && !isNaN(args[0])) {
      userId = args[0];
    }

    try {
      const user = await api.getUserInfo(userId);

      const info = `
👤 User Information

Name: ${user.name}
Username: @${user.username}
User ID: ${user.id}
      `.trim();

      return api.sendMessage(info);
    } catch (error) {
      return api.sendMessage('❌ Failed to get user info');
    }
  }
};
