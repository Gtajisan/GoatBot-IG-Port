module.exports = {
  config: {
    name: 'account',
    version: '1.0',
    author: 'Gtajisan',
    cooldown: 5,
    role: 0,
    description: 'View your account information',
    category: 'utility',
    usage: '{pn}'
  },

  async run({ api, event, message }) {
    try {
      const userID = event.senderID;
      const userInfo = (await api.getUserInfo(userID))[userID];

      let msg = `👤 ACCOUNT INFO\n`;
      msg += `━━━━━━━━━━━━━━━━\n`;
      msg += `➥ Name: ${userInfo.fullName || 'N/A'}\n`;
      msg += `➥ Username: @${userInfo.username || 'N/A'}\n`;
      msg += `➥ User ID: ${userID}\n`;
      msg += `➥ Private: ${userInfo.isPrivate ? 'Yes' : 'No'}\n`;
      msg += `➥ Verified: ${userInfo.isVerified ? 'Yes' : 'No'}\n`;
      msg += `➥ Bio: ${userInfo.biography || 'No biography'}`;

      return message.reply({
        body: msg,
        attachment: userInfo.profilePicUrl
      });
    } catch (e) {
      return message.reply(`❌ Error: ${e.message}`);
    }
  }
};
