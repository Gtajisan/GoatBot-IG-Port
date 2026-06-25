const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" }
];

module.exports = {
  config: { name: 'quote', aliases: ['q'], description: 'Get an inspirational quote', usage: 'quote', cooldown: 3, role: 0, category: 'fun' },
  async run({ api, event, logger }) {
    try {
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      return api.sendMessage(`💭 "${q.text}"\n\n— ${q.author}`, event.threadId);
    } catch (e) { logger.error('Error in quote', { error: e.message }); return api.sendMessage('❌ Error.', event.threadId); }
  }
};
