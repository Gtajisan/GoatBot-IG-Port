module.exports = {
  config: {
    name: "user",
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 2,
    description: "Manage users in the bot",
    category: "admin",
    usage: "{pn} ban <uid> | {pn} unban <uid> | {pn} info <uid>"
  },

  async onStart({ message, args, database, api }) {
    const action = args[0]?.toLowerCase();
    const uid = args[1] || (event.messageReply?.senderID);

    if (!uid && action !== "list") return message.reply("❌ Please provide user ID.");

    if (action === "ban") {
      await database.banUser(uid);
      return message.reply(`✅ Banned user ${uid}`);
    } else if (action === "unban") {
      await database.unbanUser(uid);
      return message.reply(`✅ Unbanned user ${uid}`);
    } else if (action === "info") {
      const userData = await database.getUser(uid);
      return message.reply(`👤 User Info:\n- Name: ${userData.name}\n- Banned: ${userData.banned ? "Yes" : "No"}\n- Role: ${userData.role}`);
    }

    return message.reply(`『 USAGE 』\n${this.config.usage.replace(/\{pn\}/g, 'user')}`);
  }
};
