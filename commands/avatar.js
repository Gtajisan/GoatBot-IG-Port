const axios = require('axios');

module.exports = {
  config: {
    name: "avatar",
    author: "NTKhang",
    version: "1.6",
    cooldown: 5,
    role: 0,
    description: "create anime avatar with signature",
    category: "image",
    usage: "{pn} <id/name> | <bg text> | <signature> | <color>"
  },

  async onStart({ args, message, api }) {
    const content = args.join(" ").split("|").map(item => item.trim());
    if (!args[0]) return message.SyntaxError();

    await message.reply("Initializing image, please wait...");

    try {
      const charData = (await axios.get("https://goatbotserver.onrender.com/taoanhdep/listavataranime?apikey=ntkhang")).data.data;
      let id, name;

      if (!isNaN(content[0])) {
        id = parseInt(content[0]);
        if (id >= charData.length) return message.reply(`Only ${charData.length} characters available.`);
        name = charData[id].name;
      } else {
        const found = charData.find(i => i.name.toLowerCase() === content[0].toLowerCase());
        if (!found) return message.reply(`Character "${content[0]}" not found.`);
        id = found.stt;
        name = content[0];
      }

      const endpoint = `https://goatbotserver.onrender.com/taoanhdep/avataranime`;
      const params = {
        id,
        chu_Nen: content[1] || "",
        chu_Ky: content[2] || "",
        colorBg: content[3] || "orange",
        apikey: "ntkhangGoatBot"
      };

      const res = await axios.get(endpoint, { params, responseType: "stream" });

      return message.reply({
        body: `✓ Your avatar\nCharacter: ${name}\nID: ${id}`,
        attachment: res.data
      });
    } catch (e) {
      return message.reply(`❌ Error: ${e.message}`);
    }
  }
};
