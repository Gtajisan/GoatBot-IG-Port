module.exports = {
  config: {
    name: "ignoreonlyad",
    aliases: ["ioa"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 2,
    description: "Ignore command not found notification for admins",
    category: "config",
    usage: "{pn}"
  },

  async onStart({ message, config, threadsData, event }) {
    // Ported from GoatBot V2 logic
    // This usually toggles a setting in the config or thread data
    const threadID = event.threadID;
    const threadData = await threadsData.get(threadID);
    const current = threadData?.settings?.ignoreOnlyAdmin || false;

    await threadsData.set(threadID, {
      settings: { ...threadData?.settings, ignoreOnlyAdmin: !current }
    });

    return message.reply(`✅ Successfully ${!current ? "enabled" : "disabled"} ignore only admin mode for this group.`);
  }
};
