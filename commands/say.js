
export default {
  config: {
    name: 'say',
    aliases: ['echo'],
    description: 'Make the bot say something',
    usage: '<message>',
    cooldown: 5,
    role: 0
  },

  async run({ api, args }) {
    if (args.length === 0) {
      return api.sendMessage('❌ Please provide a message');
    }

    const message = args.join(' ');
    return api.sendMessage(message);
  }
};
