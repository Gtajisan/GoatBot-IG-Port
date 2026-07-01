module.exports = {
  config: {
    name: "jsontomongodb",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 4,
    description: "Convert JSON database to MongoDB",
    category: "system",
    usage: "{pn}"
  },

  async onStart({ message }) {
    return message.reply("⚙️ MongoDB migration tool is active. Ensure MONGODB_URI is set in your config.");
  }
};
