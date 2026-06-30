module.exports = {
  config: {
    name: "sorthelp",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 4,
    description: "Sort help categories",
    category: "system",
    usage: "{pn}"
  },

  async onStart({ message }) {
    return message.reply("✅ Help categories sorted by alphabetical order (default behavior).");
  }
};
