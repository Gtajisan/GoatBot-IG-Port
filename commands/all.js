module.exports = {
  config: {
    name: 'all',
    version: '1.2',
    author: 'NTKhang',
    cooldown: 5,
    role: 1,
    description: 'Tag all members in your group chat',
    category: 'box chat',
    usage: '{pn} [content | empty]'
  },

  async run({ api, event, args, message }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participantIDs = (threadInfo.participants || []).map(p => p.userID);

      if (participantIDs.length === 0) return message.reply("Could not find any participants to tag.");

      const mentions = [];
      let body = args.join(" ") || "All members, look here!";

      // Instagram mentions work differently than Facebook.
      // Usually, it's just @username.
      // Our API wrapper might handle mentions if provided in the right format.
      // For now, let's just list the IDs or mention them if possible.

      let msg = body + "\n\n";
      for (const uid of participantIDs) {
        msg += `@${uid} `; // This is a placeholder; real tagging depends on FCA capability
        mentions.push({
          id: uid,
          tag: `@${uid}`
        });
      }

      return message.reply({ body: msg, mentions });
    } catch (e) {
      // If getThreadInfo fails, try using participantIDs from event if available
      const participantIDs = event.participantIDs || [];
      if (participantIDs.length > 0) {
          let msg = (args.join(" ") || "Attention everyone!") + "\n\n";
          for (const uid of participantIDs) {
            msg += `@${uid} `;
          }
          return message.reply(msg);
      }
      return message.reply("❌ Error: Could not retrieve group members.");
    }
  }
};
