module.exports = {
  config: {
    name: "customrankcard",
    aliases: ["crc"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Customize your rank card background",
    category: "utility",
    usage: "{pn} <url>"
  },

  async onStart({ message, args, database, event }) {
    const url = args[0] || (event.messageReply?.attachments?.[0]?.url);
    if (!url) return message.reply("Please provide an image URL or reply to an image.");

    const userData = await database.getUser(event.senderID);
    userData.rankCardBg = url;
    await database.updateUser(event.senderID, userData);

    return message.reply("✅ Your rank card background has been updated.");
  }
};
