module.exports = {
  config: { name: 'dice', aliases: ['roll', 'die'], description: 'Roll a dice', usage: 'dice [sides]', cooldown: 2, role: 0, category: 'game' },
  async run({ api, event, args, logger }) {
    const sides = parseInt(args[0]) || 6;
    if (sides < 2 || sides > 100) return api.sendMessage('❌ Dice sides must be between 2 and 100.', event.threadId);
    const result = Math.floor(Math.random() * sides) + 1;
    return api.sendMessage(`🎲 Rolling a ${sides}-sided dice...\n\nResult: ${result}`, event.threadId);
  }
};
