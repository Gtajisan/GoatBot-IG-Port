const axios = require('axios');

module.exports = {
  config: {
    name: "say",
    version: "1.7",
    author: "Samir Œ",
    cooldown: 5,
    role: 0,
    category: "tts",
    description: "Convert text to voice",
    usage: "say <text> | <lang_code>"
  },

  async onStart({ api, args, message, event }) {
    let text;
    let lang = 'en';

    if (event.replyToItemId) {
        // Simple logic for reply-to-say
        text = event.body; // In this bot, we'd need to fetch the original message if we want to say it
    }

    if (args.includes("|")) {
      const splitArgs = args.join(" ").split("|").map(arg => arg.trim());
      text = splitArgs[0];
      lang = splitArgs[1] || 'en';
    } else {
      text = args.join(" ");
    }

    if (!text) return message.reply(`Please provide some text.`);

    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;
      await api.sendVoiceFromUrl(event.threadId, url);
    } catch (err) {
      console.error(err);
      message.reply("An error occurred during TTS conversion.");
    }
  }
};
