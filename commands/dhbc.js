const axios = require("axios");

module.exports = {
  config: {
    name: "dhbc",
    version: "1.3",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Play game catch the word",
    category: "game"
  },

  async onStart({ message, event, commandName, database }) {
    try {
      const response = await axios.get("https://goatbotserver.onrender.com/api/duoihinhbatchu");
      const { wordcomplete, casi, image1, image2 } = response.data.data;

      const body = `Please reply this message with the answer\n${wordcomplete.replace(/\S/g, "█ ")}` + (casi ? `\nThis is a song by ${casi}` : '');

      await message.reply(body);
      // Instagram API might need separate calls for images or supporting multi-photo
      await api.sendPhotoFromUrl(event.threadId, image1);
      const res2 = await api.sendPhotoFromUrl(event.threadId, image2);

      if (res2 && res2.messageID) {
        database.setReplyData(res2.messageID, {
          commandName,
          author: event.senderID,
          wordcomplete,
          reward: 1000
        });
      }
    } catch (e) {
      console.error(e);
      message.reply("Failed to start game.");
    }
  },

  async handleReply({ message, event, replyData, usersData, database }) {
    if (event.senderID != replyData.author) return message.reply("You are not the player of this question!");

    if (formatText(event.body) == formatText(replyData.wordcomplete)) {
      database.addBalance(event.senderID, replyData.reward);
      message.reply(`★ Congratulations! Correct answer. You received ${replyData.reward}$`);
    } else {
      message.reply("⚠ Incorrect answer!");
    }
  }
};

function formatText(text) {
  return text.normalize("NFD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[đ|Đ]/g, (x) => x == "đ" ? "d" : "D");
}
