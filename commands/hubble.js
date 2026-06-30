const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "hubble",
    version: "1.0.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "See what Hubble saw on your birthday",
    category: "image",
    usage: "hubble <mm-dd> (e.g. hubble 05-12)"
  },

  onLoad: async function() {
    const pathData = path.join(process.cwd(), 'storage', 'hubble_nasa.json');
    if (!fs.existsSync(pathData)) {
        await fs.ensureDir(path.dirname(pathData));
        const res = await axios.get('https://raw.githubusercontent.com/Gtajisan/Goat-Bot-V2/main/scripts/cmds/assets/hubble/nasa.json');
        await fs.writeJson(pathData, res.data);
    }
  },

  onStart: async function ({ message, args, api, event }) {
    const dateInput = args[0];
    if (!dateInput) return message.reply("Please provide a date in mm-dd format (e.g. 05-12).");

    const pathData = path.join(process.cwd(), 'storage', 'hubble_nasa.json');
    const hubbleData = await fs.readJson(pathData);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const parts = dateInput.split(/[-/]/);
    if (parts.length !== 2) return message.reply("Invalid format. Use mm-dd.");

    let month = parseInt(parts[0]);
    let day = parseInt(parts[1]);

    if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
        return message.reply("Invalid date.");
    }

    const dateText = `${monthNames[month - 1]} ${day}`;
    const data = hubbleData.find(e => e.date.startsWith(dateText));

    if (!data) return message.reply("No image found for this date.");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const imageUrl = 'https://imagine.gsfc.nasa.gov/hst_bday/images/' + data.image;
      const msg = `📅 Date: ${dateText}\n🌀 Name: ${data.name}\n📖 Caption: ${data.caption}\n🔗 Source: ${data.url}`;

      await message.reply({
        body: msg,
        attachment: imageUrl
      });
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (err) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("Error fetching Hubble image.");
    }
  }
};
