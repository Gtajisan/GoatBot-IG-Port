module.exports = {
  config: { name: 'echo', aliases: ['say'], description: 'Repeat a message', usage: 'echo <text>', cooldown: 3, role: 2, category: 'admin' },
  async run({ api, event, args, logger }) {
    if (!args.length) return api.sendMessage('❌ Usage: echo <text>', event.threadId);
    return api.sendMessage(args.join(' '), event.threadId);
  }
};
