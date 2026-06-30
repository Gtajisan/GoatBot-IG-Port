module.exports = {
  config: {
    name: "testmedia",
    version: "1.0",
    author: "Gtajisan",
    cooldown: 5,
    role: 2,
    description: "Test DualFca media sending",
    category: "admin",
    usage: "{pn}"
  },

  async onStart({ message, api, event }) {
    await message.reply("Testing media send through wrapper...");
    try {
        await message.reply({
            body: "Test Image",
            attachment: "https://raw.githubusercontent.com/Gtajisan/GoatBot-IG-Port/main/assets/screenshots/dashboard-overview.jpg"
        });
        return message.reply("✅ Media test initiated.");
    } catch (e) {
        return message.reply(`❌ Media test failed: ${e.message}`);
    }
  }
};
