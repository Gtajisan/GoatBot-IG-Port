const axios = require('axios');

module.exports = {
  config: {
    name: 'fbcover',
    version: '6.9',
    author: 'Ajmaul',
    cooldown: 5,
    role: 0,
    description: 'Generate Facebook cover using API',
    category: 'group',
    usage: 'fbcover v1/v2/v3 - name - title - address - email - phone - color'
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const input = args.join(' ');
    let uid;

    if (event.type === 'message_reply') {
      uid = event.messageReply.senderID;
    } else {
      uid = Object.keys(event.mentions)[0] || event.senderID;
    }

    const userName = await usersData.getName(uid);

    if (!input) {
      return message.reply('❌| Wrong format\nTry: fbcover v1/v2/v3 - name - title - address - email - phone - color (default = white)');
    }

    const msg = input.split('-');
    const v = msg[0]?.trim() || 'v1';
    const name = msg[1]?.trim() || ' ';
    const subname = msg[2]?.trim() || ' ';
    const address = msg[3]?.trim() || ' ';
    const email = msg[4]?.trim() || ' ';
    const phone = msg[5]?.trim() || ' ';
    const color = msg[6]?.trim() || 'white';

    message.reply('Processing your cover, wait koro baby 😘');
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const baseApiUrlRes = await axios.get('https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json');
      const baseApiUrl = baseApiUrlRes.data.api;

      const img = `${baseApiUrl}/cover/${v}?name=${encodeURIComponent(name)}&subname=${encodeURIComponent(subname)}&number=${encodeURIComponent(phone)}&address=${encodeURIComponent(address)}&email=${encodeURIComponent(email)}&colour=${encodeURIComponent(color)}&uid=${uid}`;

      await message.reply({
        body: `✿━━━━━━━━━━━━━━━━━━━━━━━━━━━✿\n` +
            `🔵 FIRST NAME: ${name}\n` +
            `⚫ SECOND NAME: ${subname}\n` +
            `⚪ ADDRESS: ${address}\n` +
            `📫 MAIL: ${email}\n` +
            `☎️ PHONE NO.: ${phone}\n` +
            `☢️ COLOR: ${color}\n` +
            `💁 USER NAME: ${userName}\n` +
            `✅ Version: ${v}\n` +
            `✿━━━━━━━━━━━━━━━━━━━━━━━━━━━✿`,
        attachment: img
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (error) {
      console.error(error);
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      message.reply('❌ Error occurred while generating FB cover.');
    }
  }
};
