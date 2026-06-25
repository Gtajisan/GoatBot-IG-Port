module.exports = {
  config: { name: 'rps', aliases: ['rockpaperscissors'], description: 'Rock Paper Scissors', usage: 'rps <rock|paper|scissors>', cooldown: 2, role: 0, category: 'game' },
  async run({ api, event, args, logger }) {
    const choices = ['rock','paper','scissors'], emojis = { rock:'✊', paper:'✋', scissors:'✌️' };
    if (!args[0] || !choices.includes(args[0].toLowerCase())) return api.sendMessage('✊✋✌️ Usage: rps <rock|paper|scissors>', event.threadId);
    const uc = args[0].toLowerCase(), bc = choices[Math.floor(Math.random() * 3)];
    let result = uc === bc ? "It's a tie!" : ((uc==='rock'&&bc==='scissors')||(uc==='paper'&&bc==='rock')||(uc==='scissors'&&bc==='paper')) ? '🎉 You win!' : '💔 I win!';
    return api.sendMessage(`✊✋✌️ Rock Paper Scissors!\n\nYou: ${emojis[uc]} ${uc}\nBot: ${emojis[bc]} ${bc}\n\n${result}`, event.threadId);
  }
};
