const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "jsontosqlite",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 4,
    description: "Convert JSON database to SQLite",
    category: "system",
    usage: "{pn}"
  },

  async onStart({ message, database }) {
    // This is a placeholder for actual migration logic if needed
    return message.reply("⚙️ Database migration tool is active. Ensure your JSON files are in database/data/.");
  }
};
