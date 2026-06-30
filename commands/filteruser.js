module.exports = {
  config: {
    name: "filteruser",
    version: "1.0",
    author: "NTKhang",
    cooldown: 10,
    role: 1,
    description: "Remove inactive users (not implemented for IG)",
    category: "admin",
    usage: "{pn}"
  },

  async onStart({ message }) {
    return message.reply("⚠️ This command is not yet fully compatible with Instagram's private API due to member activity tracking limitations.");
  }
};
