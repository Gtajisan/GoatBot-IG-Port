const { exec } = require("child_process");

module.exports = {
  config: {
    name: "update",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 4,
    description: "Update bot from GitHub",
    category: "system",
    usage: "{pn}"
  },

  async onStart({ message }) {
    await message.reply("🔄 Checking for updates...");

    exec("git pull", (err, stdout, stderr) => {
      if (err) return message.reply(`❌ Update failed: ${err.message}`);
      if (stdout.includes("Already up to date.")) return message.reply("✅ Bot is already up to date.");

      return message.reply(`✅ Updated successfully!\n\n${stdout}\nRestarting...`).then(() => {
        process.exit(0);
      });
    });
  }
};
