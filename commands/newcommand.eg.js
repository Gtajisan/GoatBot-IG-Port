module.exports = {
  config: {
    name: "example",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Example command template",
    category: "utility",
    usage: "{pn}"
  },

  async onStart({ message, event, args, api, bot, database, usersData, threadsData, getLang }) {
    return message.reply("This is an example command template.");
  },

  async onChat({ message, event, api }) {
    // Optional: runs on every message
  },

  async onReply({ message, event, Reply, api }) {
    // Optional: runs when someone replies to this command's message
  },

  async onReaction({ message, event, Reaction, api }) {
    // Optional: runs when someone reacts to this command's message
  }
};
