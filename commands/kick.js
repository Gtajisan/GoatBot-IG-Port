module.exports = {
  config: {
    name: "kick",
    version: "1.3",
    author: "NTKhang",
    cooldown: 5,
    role: 1,
    description: "Kick member out of chat box",
    category: "box chat"
  },

  async onStart({ message, event, args, threadsData, api }) {
    if (!event.isGroup) return message.reply("This command only works in groups.");

    // In many private IG APIs, bot must be admin to kick
    // We try to kick based on mentions or reply

    let uids = [];
    if (event.replyToItemId) {
        // We'd need to know who we're replying to.
        // For now, we rely on mentions or manual UID
        message.reply("Please mention the user to kick or use their UID.");
        return;
    }

    if (args.length > 0) {
        if (event.mentions && Object.keys(event.mentions).length > 0) {
            uids = Object.keys(event.mentions);
        } else if (/^\d+$/.test(args[0])) {
            uids = [args[0]];
        }
    }

    if (uids.length === 0) return message.reply("Please mention a user to kick.");

    for (const uid of uids) {
      try {
        // Attempting to use a common method name for removal
        if (typeof api.removeUserFromGroup === 'function') {
            await api.removeUserFromGroup(uid, event.threadId);
        } else if (typeof api.removeParticipant === 'function') {
            await api.removeParticipant(event.threadId, uid);
        } else {
            return message.reply("Kicking is not supported by the current API layer.");
        }
        message.reply(`Kicked user ${uid}`);
      } catch (e) {
        message.reply(`Failed to kick ${uid}: ${e.message}`);
      }
    }
  }
};
