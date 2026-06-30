const itunes = require("searchitunes");
const axios = require("axios");

module.exports = {
  config: {
    name: "appstore",
    version: "1.2",
    author: "NTKhang",
    cooldown: 5,
    role: 0,
    description: "Search app on App Store",
    category: "software",
    usage: "{pn} <keyword>"
  },

  async onStart({ message, args, api }) {
    if (!args[0]) return message.reply("Please enter a keyword to search.");

    try {
      const results = (await itunes({
        entity: "software",
        country: "US",
        term: args.join(" "),
        limit: 3
      })).results;

      if (!results || results.length === 0) return message.reply(`No results found for "${args.join(" ")}"`);

      let msg = "";
      const attachments = [];
      for (const res of results) {
        msg += `\n\n- ${res.trackCensoredName} by ${res.artistName}\n- Price: ${res.formattedPrice}\n- Rating: ${res.averageUserRating?.toFixed(1) || 'N/A'}/5\n- Link: ${res.trackViewUrl}`;

        const imgUrl = res.artworkUrl512 || res.artworkUrl100;
        if (imgUrl) {
          const stream = await axios.get(imgUrl, { responseType: "stream" });
          attachments.push(stream.data);
        }
      }

      return message.reply({
        body: msg.trim(),
        attachment: attachments
      });
    } catch (err) {
      return message.reply("❌ Error searching App Store.");
    }
  }
};
