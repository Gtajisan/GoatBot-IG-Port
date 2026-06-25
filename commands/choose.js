module.exports = {
  config: { name: 'choose', aliases: ['pick', 'random'], description: 'Choose between options', usage: 'choose <opt1> | <opt2> | ...', cooldown: 2, role: 0, category: 'fun' },
  async run({ api, event, args, logger }) {
    if (args.length === 0) return api.sendMessage('❌ Usage: choose <option1> | <option2> | ...', event.threadId);
    const opts = args.join(' ').split('|').map(o => o.trim()).filter(Boolean);
    if (opts.length < 2) return api.sendMessage('❌ Please provide at least 2 options separated by |', event.threadId);
    const chosen = opts[Math.floor(Math.random() * opts.length)];
    return api.sendMessage(`🎯 I choose: ${chosen}`, event.threadId);
  }
};
