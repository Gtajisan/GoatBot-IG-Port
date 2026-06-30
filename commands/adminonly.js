module.exports = {
  config: {
    name: "adminonly",
    aliases: ["adonly", "ao"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 1,
    description: "Toggle admin only mode for the group",
    category: "config",
    usage: "{pn}"
  },

  async onStart({ message, threadsData, event }) {
    const threadID = event.threadID;
    const threadData = await threadsData.get(threadID);
    const current = threadData?.settings?.adminOnly || false;

    await threadsData.set(threadID, {
      settings: { ...threadData?.settings, adminOnly: !current }
    });

    return message.reply(`✅ Successfully ${!current ? "enabled" : "disabled"} admin-only mode for this group.`);
  }
};
