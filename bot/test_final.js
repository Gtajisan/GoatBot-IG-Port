const InstagramBot = require('./InstagramBot');
const bot = new InstagramBot();
console.log('Bot instantiated');
console.log('DualFca integrated in constructor?', !!bot.createAPIWrapper);
