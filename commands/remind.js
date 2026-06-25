module.exports = {
  config: { name: 'remind', aliases: ['reminder'], description: 'Set a reminder', usage: 'remind <time> <message>', role: 0, cooldown: 5, category: 'utility' },
  async run({ api, event, args, database }) {
    if (args.length < 2) return api.sendMessage('⏰ Usage: remind <time> <message>\nFormats: 30s, 10m, 2h, 1d', event.threadId);
    const ms = parseTime(args[0].toLowerCase());
    if (!ms || ms <= 0) return api.sendMessage(`⚠️ Invalid time: "${args[0]}"`, event.threadId);
    if (ms > 7 * 24 * 60 * 60 * 1000) return api.sendMessage('⚠️ Max reminder time is 7 days.', event.threadId);
    const msg = args.slice(1).join(' ');
    database.addReminder(event.senderID, msg, Date.now() + ms);
    database.save();
    return api.sendMessage(`⏰ Reminder set for ${formatDuration(ms)}!\nMessage: "${msg}"`, event.threadId);
  }
};
function parseTime(s) {
  const m = s.match(/^(\d+(?:\.\d+)?)(s|m|h|d)$/);
  if (!m) return null;
  return Math.round(parseFloat(m[1]) * { s:1000, m:60000, h:3600000, d:86400000 }[m[2]]);
}
function formatDuration(ms) {
  const parts = [];
  const d = Math.floor(ms/86400000), h = Math.floor((ms%86400000)/3600000), m = Math.floor((ms%3600000)/60000), s = Math.floor((ms%60000)/1000);
  if(d) parts.push(`${d}d`); if(h) parts.push(`${h}h`); if(m) parts.push(`${m}m`); if(s&&!d) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
}
