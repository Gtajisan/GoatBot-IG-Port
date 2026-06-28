const axios = require('axios');

const BASE_URL = 'https://noobs-api.top/dipto/baby';

module.exports = {
  config: {
    name: 'bby',
    aliases: ['baby', 'bbe', 'babe'],
    description: 'Chat with Baby AI — teach it, manage replies, and more',
    usage: 'bby <message> | teach <msg> - <reply> | remove <msg> | list | msg <msg>',
    cooldown: 3,
    role: 0,
    category: 'ai'
  },

  async onStart({ api, event, args, logger, database }) {
    if (args.length === 0) {
      const idle = ['Bolo baby 🥺', 'hum...', 'Type bby help', 'Ki bolbe?'];
      const res = await api.sendMessage(idle[Math.floor(Math.random() * idle.length)], event.threadId);

      if (res && res.messageID) {
        database.setReplyData(res.messageID, { commandName: 'bby' });
      }
      return res;
    }

    const uid  = event.senderID;
    const text = args.join(' ').toLowerCase();

    try {
      if (args[0] === 'remove') {
        const msg = text.replace('remove ', '');
        const res = await axios.get(`${BASE_URL}?remove=${encodeURIComponent(msg)}&senderID=${uid}`);
        const sent = await api.sendMessage(res.data.message, event.threadId);
        if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
        return sent;
      }

      if (args[0] === 'list') {
        const res = await axios.get(`${BASE_URL}?list=all`);
        const data = res.data;
        const sent = await api.sendMessage(
          `❇️ Total Teaches: ${data.length || 'N/A'}\n♻️ Total Responses: ${data.responseLength || 'N/A'}`,
          event.threadId
        );
        if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
        return sent;
      }

      if (args[0] === 'msg') {
        const msg = text.replace('msg ', '');
        const res = await axios.get(`${BASE_URL}?list=${encodeURIComponent(msg)}`);
        const sent = await api.sendMessage(`Message "${msg}" → ${res.data.data}`, event.threadId);
        if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
        return sent;
      }

      if (args[0] === 'teach') {
        const parts = text.replace('teach ', '').split(/\s*-\s*/);
        if (parts.length < 2) return api.sendMessage('❌ Invalid format! Usage: bby teach <message> - <reply>', event.threadId);
        const [question, reply] = parts;
        const res = await axios.get(`${BASE_URL}?teach=${encodeURIComponent(question)}&reply=${encodeURIComponent(reply)}&senderID=${uid}`);
        const sent = await api.sendMessage(`✅ Taught!\n${res.data.message}`, event.threadId);
        if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
        return sent;
      }

      const res = await axios.get(`${BASE_URL}?text=${encodeURIComponent(text)}&senderID=${uid}&font=1`);
      const sent = await api.sendMessage(res.data.reply || '...', event.threadId);

      if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
      return sent;

    } catch (error) {
      logger.error('bby error', { error: error.message });
      return api.sendMessage('❌ Baby AI is unavailable right now.', event.threadId);
    }
  },

  async handleReply({ api, event, logger, database }) {
    const uid  = event.senderID;
    const text = (event.body || '').trim().toLowerCase();
    if (!text) return;

    try {
      const res = await axios.get(`${BASE_URL}?text=${encodeURIComponent(text)}&senderID=${uid}&font=1`);
      const sent = await api.sendMessage(res.data.reply || '...', event.threadId);
      if (sent && sent.messageID) database.setReplyData(sent.messageID, { commandName: 'bby' });
    } catch (error) {
      logger.error('bby handleReply error', { error: error.message });
      return api.sendMessage('❌ Baby AI is unavailable right now.', event.threadId);
    }
  }
};
