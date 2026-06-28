module.exports = {
  config: {
    name: "adduser",
    version: "1.5",
    author: "NTKhang",
    cooldown: 5,
    role: 1,
    description: "Add user to chat box",
    category: "box chat"
  },

  async onStart({ message, api, event, args }) {
    if (!event.isGroup) return message.reply("This command only works in groups.");
    const input = args[0];
    if (!input) return message.reply("Please provide a UID or Profile Link.");

    let uid = input;
    if (input.includes("instagram.com/")) {
        const username = input.split("/")[3];
        try {
            const info = await api.getUserInfoByUsername(username);
            uid = info.userID || info.pk;
        } catch (e) {
            return message.reply("Failed to resolve username from link.");
        }
    }

    try {
        if (typeof api.addUserToGroup === 'function') {
            await api.addUserToGroup(uid, event.threadId);
        } else if (typeof api.addParticipant === 'function') {
            await api.addParticipant(event.threadId, uid);
        } else {
            return message.reply("Adding users is not supported by the current API layer.");
        }
        message.reply(`Successfully added user ${uid} to the group.`);
    } catch (e) {
        message.reply(`Failed to add user: ${e.message}`);
    }
  }
};
