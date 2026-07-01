const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "save",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 4,
    description: "Save code to a file",
    category: "system",
    usage: "{pn} <filename> | <code>"
  },

  async onStart({ message, args }) {
    const content = args.join(" ").split("|").map(s => s.trim());
    if (content.length < 2) return message.reply("❌ Usage: save <filename> | <code>");

    const filePath = path.join(process.cwd(), "commands", content[0]);
    try {
      await fs.writeFile(filePath, content[1]);
      return message.reply(`✅ Saved to ${content[0]}`);
    } catch (e) {
      return message.reply(`❌ Failed to save: ${e.message}`);
    }
  }
};
