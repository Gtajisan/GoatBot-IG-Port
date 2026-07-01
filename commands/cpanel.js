module.exports = {
  config: {
    name: "cpanel",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 4,
    description: "Bot control panel",
    category: "system",
    usage: "{pn}"
  },

  async onStart({ message, bot }) {
    const port = bot.config.DASHBOARD_PORT || 3000;
    return message.reply(`🖥️ Control Panel is available at: http://localhost:${port}/dashboard`);
  }
};
