const axios = require("axios");

module.exports = {
  config: {
    name: "emojimix",
    version: "1.4",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Mix 2 emoji together",
    usage: "{pn} <emoji1> <emoji2>",
    category: "fun"
  },

  async run({ api, event, args, message }) {
    const emoji1 = args[0];
    const emoji2 = args[1];

    if (!emoji1 || !emoji2) {
      return message.reply("❌ Usage: emojimix <emoji1> <emoji2>");
    }

    const attachments = [];

    // Try both orders
    const res1 = await generateEmojimix(emoji1, emoji2);
    if (res1) attachments.push(res1);

    const res2 = await generateEmojimix(emoji2, emoji1);
    if (res2) attachments.push(res2);

    if (attachments.length === 0) {
      return message.reply(`❌ Sorry, emoji ${emoji1} and ${emoji2} can't be mixed.`);
    }

    return message.reply({
      body: `Successfully mixed ${emoji1} and ${emoji2}!`,
      attachment: attachments
    });
  }
};

async function generateEmojimix(emoji1, emoji2) {
  try {
    const res = await axios.get("https://goatbotserver.onrender.com/taoanhdep/emojimix", {
      params: { emoji1, emoji2 },
      responseType: "stream"
    });
    return res.data;
  } catch (e) {
    return null;
  }
}
