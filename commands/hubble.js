const axios = require('axios');

const monthText = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function checkValidDate(date) {
    const dateArr = date.split(/[-/]/);
    if (dateArr.length != 2) return false;
    let day, month;
    if (dateArr[0] < 13) {
        day = dateArr[1]; month = dateArr[0];
    } else {
        day = dateArr[0]; month = dateArr[1];
    }
    month = parseInt(month); day = parseInt(day);
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (month === 2 && day > 29) return false;
    if ([4, 6, 9, 11].includes(month) && day > 30) return false;
    return monthText[month - 1] + ' ' + day;
}

module.exports = {
    config: {
        name: 'hubble',
        version: '1.3',
        author: 'NTKhang',
        cooldown: 5,
        role: 0,
        description: 'View Hubble images',
        category: 'fun',
        usage: 'hubble <date (mm-dd)>'
    },

    onStart: async function ({ message, args, api, event }) {
        const date = args[0] || '';
        const dateText = checkValidDate(date);
        if (!date || !dateText) return message.reply('The date you entered is invalid, please enter again in the mm-dd format');

        api.setMessageReaction('⏳', event.messageID, () => {}, true);

        try {
            const res = await axios.get('https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2/main/scripts/cmds/assets/hubble/nasa.json');
            const hubbleData = res.data;
            const data = hubbleData.find(e => e.date.startsWith(dateText));
            if (!data) return message.reply('No images were found on this day');

            const { image, name, caption, url } = data;
            const imageUrl = 'https://imagine.gsfc.nasa.gov/hst_bday/images/' + image;
            const msg = `📅 Date: ${dateText}\n🌀 Name: ${name}\n📖 Caption: ${caption}\n🔗 Source: ${url}`;

            await message.reply({
                body: msg,
                attachment: imageUrl
            });
            api.setMessageReaction('✅', event.messageID, () => {}, true);
        } catch (err) {
            console.error('Hubble error:', err.message);
            api.setMessageReaction('❌', event.messageID, () => {}, true);
            message.reply('❌ Error fetching Hubble image.');
        }
    }
};
