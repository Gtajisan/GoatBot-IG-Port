const axios = require('axios');

module.exports = {
  config: {
    name: 'gay',
    version: '1.6',
    author: 'Ajmaul',
    cooldown: 2,
    role: 0,
    description: 'Generate a gay image with two user IDs.',
    category: 'fun',
    usage: 'gay @mention @mention OR gay @mention OR reply'
  },

  onStart: async function ({ api, event, message, usersData }) {
    try {
      const mentions = Object.keys(event.mentions || {});
      let uid1, uid2;
      let uid1Name, uid2Name;

      if (mentions.length >= 2) {
        uid1 = mentions[0];
        uid2 = mentions[1];
        uid1Name = await usersData.getName(uid1);
        uid2Name = await usersData.getName(uid2);
      } else if (mentions.length === 1) {
        uid1 = event.senderID;
        uid2 = mentions[0];
        uid1Name = await usersData.getName(uid1);
        uid2Name = await usersData.getName(uid2);
      } else if (event.messageReply) {
        uid1 = event.senderID;
        uid2 = event.messageReply.senderID;
        uid1Name = await usersData.getName(uid1);
        uid2Name = await usersData.getName(uid2);
      } else {
        return message.reply('Please reply to a message or mention one or two users.');
      }

      api.setMessageReaction('⏳', event.messageID, () => {}, true);
      const url = `https://neokex-apis.onrender.com/gay?uid1=${uid1}&uid2=${uid2}`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });

      await message.reply({
        body: `Oh yeah ${uid1Name} 💋 ${uid2Name}`,
        attachment: Buffer.from(response.data, 'binary'),
        mentions: [
          { tag: uid1Name, id: uid1 },
          { tag: uid2Name, id: uid2 }
        ]
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (e) {
      console.error('Gay error:', e.message);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      message.reply('❌ Couldn\'t generate image. Try again later.');
    }
  }
};
