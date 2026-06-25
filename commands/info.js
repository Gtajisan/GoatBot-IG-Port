const os = require("os");

module.exports = {
    config: {
        name: "info",
        version: "1.0.0",
        author: "Gtajisan",
        countDown: 5,
        role: 0,
        description: {
            vi: "Xem thông tin về bot",
            en: "View bot information and credits"
        },
        category: "info",
        guide: {
            vi: "{pn}",
            en: "{pn}"
        }
    },

    langs: {
        vi: {
            info: "╭─── BOT INFO ───⭓\n│ Tên: %1\n│ Phiên bản: %2\n│ Prefix: %3\n│ Lệnh: %4\n│ Uptime: %5\n├─── DEVELOPER ───⭔\n│ Main Dev: Gtajisan\n│ Email: ffjisan804@gmail.com\n├─── CREDITS ───⭔\n│ Original GoatBot V2: NTKhang\n│ Instagram Port: Gtajisan\n│ FCA API: Various Contributors\n╰─────────────⭓"
        },
        en: {
            info: "╭─── BOT INFO ───⭓\n│ Name: %1\n│ Version: %2\n│ Prefix: %3\n│ Commands: %4\n│ Uptime: %5\n├─── DEVELOPER ───⭔\n│ Main Dev: Gtajisan\n│ Email: ffjisan804@gmail.com\n├─── CREDITS ───⭔\n│ Original GoatBot V2: NTKhang\n│ Instagram Port: Gtajisan\n│ FCA API: Various Contributors\n╰─────────────⭓"
        }
    },

    onStart: async function ({ message, getLang }) {
        const { commands } = global.GoatBot;
        const config = global.GoatBot.config;
        
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
        
        const botName = config.nickNameBot || "GoatBot-IG";
        const version = "1.5.35";
        const prefix = config.prefix || "/";
        const commandCount = commands.size;
        
        return message.reply(getLang("info", botName, version, prefix, commandCount, uptimeStr));
    }
};
