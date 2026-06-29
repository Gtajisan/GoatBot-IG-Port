const axios = require('axios');

module.exports = {
  config: {
    name: 'blur',
    version: '1.0',
    author: 'Ajmaul',
    cooldown: 10,
    role: 0,
    description: 'Apply blur effect to profile picture',
    category: 'fun',
    usage: 'blur [@mention or reply]'
  },

  onStart: async function ({ api, event, message, usersData }) {
    let uid;
    if (Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } else if (event.type === 'message_reply') {
      uid = event.messageReply.senderID;
    } else {
      uid = event.senderID;
    }

    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const userInfo = (await api.getUserInfo(uid))[uid];
      const avatarURL = userInfo.profilePicUrlHd || userInfo.hdProfilePicUrlInfo?.url || userInfo.profile_pic_url_hd || userInfo.profilePicUrl;

      if (!avatarURL) throw new Error('Could not find profile picture URL');

      const res = await axios.get(`https://api.popcat.xyz/v2/blur?image=${encodeURIComponent(avatarURL)}`, {
        responseType: 'arraybuffer'
      });

      await message.reply({
        body: '🌫️ Here\'s your blurred image!',
        attachment: Buffer.from(res.data, 'binary')
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (err) {
      console.error(err);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      message.reply('❌ | Failed to generate blurred image.');
    }
  }
};
