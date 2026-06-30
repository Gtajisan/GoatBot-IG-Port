const axios = require("axios");

module.exports = {
  config: {
    name: "wanted",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Wanted poster generator",
    category: "image",
    usage: "{pn} <@tag | reply>"
  },

  async onStart({ message, event, api }) {
    let targetID;
    if (event.messageReply) targetID = event.messageReply.senderID;
    else if (event.mentions && Object.keys(event.mentions).length > 0) targetID = Object.keys(event.mentions)[0];
    else targetID = event.senderID;

    const url = `https://api.popcat.xyz/wanted?image=https://www.instagram.com/p/avatar/${targetID}`;
    return message.reply({ attachment: url });
  }
};
