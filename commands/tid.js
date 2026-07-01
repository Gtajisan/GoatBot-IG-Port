module.exports = {
  config: {
    name: 'tid',
    version: '1.2',
    author: 'NTKhang',
    cooldown: 5,
    role: 0,
    description: 'View threadID of your group chat',
    category: 'info',
    usage: '{pn}'
  },
  async run({ api, event }) {
    return api.sendMessage(event.threadID.toString(), event.threadID);
  }
};
