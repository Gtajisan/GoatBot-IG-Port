module.exports = {
  config: {
    name: "theme",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 1,
    description: "Create and apply AI themes for chat group",
    category: "config",
    usage: "{pn} <theme name>"
  },

  async onStart({ message, args, api, event }) {
    // Note: Instagram theme support is limited in private APIs.
    // This command will just send a confirmation message for now.
    const themeName = args.join(" ");
    if (!themeName) return message.reply("Please provide a theme name.");

    return message.reply(`🎨 Theme "${themeName}" has been selected. (Note: Theme application depends on API support)`);
  }
};
