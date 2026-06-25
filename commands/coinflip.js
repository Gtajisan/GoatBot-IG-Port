module.exports = {
  config: { name: 'coinflip', aliases: ['coin', 'flip'], description: 'Flip a coin', usage: 'coinflip', cooldown: 2, role: 0, category: 'game' },
  async run({ api, event, logger }) {
    const result = Math.random() < 0.5 ? '🪙 Heads!' : '🪙 Tails!';
    return api.sendMessage(result, event.threadId);
  }
};
