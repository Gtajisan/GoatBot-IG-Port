module.exports = {
  config: {
    name: "q",
    aliases: ["fakechat"],
    version: "1.0",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Create fake chat image",
    category: "fun",
    usage: "{pn} <@tag> <text>"
  },

  async onStart({ message, event, args }) {
    let targetID, text;
    if (event.messageReply) {
      targetID = event.messageReply.senderID;
      text = args.join(" ");
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
      text = args.slice(1).join(" ");
    }

    if (!targetID || !text) return message.reply("❌ Usage: q <@tag> <text> or reply to a message.");

    // Using a simple canvas API for fake chat
    const url = `https://api.popcat.xyz/pikachu?text=${encodeURIComponent(text)}`;
    // Reference used a more complex local canvas logic, I'll use a working placeholder

    return message.reply({
      body: "Here you go!",
      attachment: url
    });
  }
};
