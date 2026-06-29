const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "dih",
    version: "1.0.0",
    author: "Jules (Ported)",
    cooldown: 5,
    role: 0,
    description: "Measure your dih, grow it daily, battle friends!",
    category: "game",
    aliases: ["dihgrow", "dihtop", "dihattack", "dihstats"]
  },

  async onStart({ args, message, event, usersData, threadsData, api, config }) {
    const { senderID, threadID } = event;
    const command = args[0] ? args[0].toLowerCase() : "grow";

    const userData = await usersData.get(senderID);
    if (!userData.data) userData.data = {};
    if (!userData.data.dih) userData.data.dih = { length: 0, lastGrowth: 0, stats: { wins: 0, losses: 0, totalAttacks: 0 } };

    if (command === "grow") {
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000;
      const lastGrowth = userData.data.dih.lastGrowth || 0;

      if (now - lastGrowth < cooldown) {
        const remaining = cooldown - (now - lastGrowth);
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        return message.reply(`Next attempt in ${hours}h ${minutes}m.`);
      }

      const growth = Math.floor(Math.random() * (12 - (-5) + 1)) + (-5);
      userData.data.dih.length = Math.max(0, (userData.data.dih.length || 0) + growth);
      userData.data.dih.lastGrowth = now;

      await usersData.set(senderID, { data: userData.data });

      const allUsers = await usersData.getAll();
      const threadData = await threadsData.get(threadID);
      const memberIDs = threadData.members.map(m => String(m.userID));

      const topDihs = allUsers
        .filter(u => memberIDs.includes(String(u.userID)) && u.data?.dih?.length !== undefined)
        .sort((a, b) => b.data.dih.length - a.data.dih.length);

      const rank = topDihs.findIndex(u => String(u.userID) === String(senderID)) + 1;

      const growthMsgs = [
        `Your dih has grown by ${growth} cm and now it is ${userData.data.dih.length} cm long.`,
        `Wow! Your dih gained ${growth} cm. Current length: ${userData.data.dih.length} cm.`,
        `It's a lucky day! Your dih increased by ${growth} cm. Now it's ${userData.data.dih.length} cm.`
      ];
      const shrinkMsgs = [
        `Oh no! Your dih has shrunk by ${Math.abs(growth)} cm and now it is ${userData.data.dih.length} cm long.`,
        `Bad news... Your dih lost ${Math.abs(growth)} cm. Current length: ${userData.data.dih.length} cm.`,
        `It was cold today. Your dih shrunk by ${Math.abs(growth)} cm. Now it's ${userData.data.dih.length} cm.`
      ];

      let msg = "";
      if (growth > 0) {
        msg = growthMsgs[Math.floor(Math.random() * growthMsgs.length)];
      } else if (growth < 0) {
        msg = shrinkMsgs[Math.floor(Math.random() * shrinkMsgs.length)];
      } else {
        msg = `Your dih didn't change today. It is still ${userData.data.dih.length} cm long.`;
      }

      msg += `\nYour position in the top is ${rank}.Next attempt in 24h 0m.`;
      return message.reply(msg);

    } else if (["top", "leaderboard"].includes(command)) {
      const allUsers = await usersData.getAll();
      const threadData = await threadsData.get(threadID);
      const memberIDs = threadData.members.map(m => String(m.userID));

      const topDihs = allUsers
        .filter(u => memberIDs.includes(String(u.userID)) && u.data?.dih?.length !== undefined)
        .sort((a, b) => b.data.dih.length - a.data.dih.length)
        .slice(0, 10);

      if (topDihs.length === 0) return message.reply("No one has grown a dih in this thread yet!");

      let leaderboardMsg = "🏆 Dih Leaderboard (Top 10)\n\n";
      for (let i = 0; i < topDihs.length; i++) {
        const u = topDihs[i];
        const name = u.name || "Unknown";
        const length = u.data.dih.length;
        const prefix = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        const isSender = String(u.userID) === String(senderID) ? " (You)" : "";
        leaderboardMsg += `${prefix} ${name}: ${length} cm${isSender}\n`;
      }

      return message.reply(leaderboardMsg);

    } else if (["attack", "battle", "fight"].includes(command)) {
      let targetID;
      if (event.messageReply) {
        targetID = event.messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (args[1]) {
        targetID = args[1];
      }

      if (!targetID || targetID === senderID) {
        return message.reply("Please mention or reply to someone to attack!");
      }

      const targetData = await usersData.get(targetID);
      if (!targetData.data?.dih || targetData.data.dih.length === 0) {
        return message.reply("This user doesn't have a dih yet or it's too small to attack!");
      }

      if (userData.data.dih.length === 0) {
        return message.reply("You need a dih to attack someone! Use !dih grow first.");
      }

      const winChance = 0.5 + (userData.data.dih.length - targetData.data.dih.length) / 1000;
      const isWin = Math.random() < Math.min(0.9, Math.max(0.1, winChance));

      const stolen = Math.floor(Math.random() * 10) + 1;

      userData.data.dih.stats.totalAttacks++;
      if (isWin) {
        userData.data.dih.length += stolen;
        targetData.data.dih.length = Math.max(0, targetData.data.dih.length - stolen);
        userData.data.dih.stats.wins++;
        targetData.data.dih.stats.losses = (targetData.data.dih.stats.losses || 0) + 1;

        await usersData.set(senderID, { data: userData.data });
        await usersData.set(targetID, { data: targetData.data });

        const winMsgs = [
          `⚔️ You won the battle! You sliced off ${stolen} cm from ${targetData.name || "Unknown"}'s dih and added it to yours.`,
          `⚔️ Victory! ${targetData.name || "Unknown"} was no match for your dih. You stole ${stolen} cm.`,
          `⚔️ CRITICAL HIT! You dominated ${targetData.name || "Unknown"} and took ${stolen} cm of their dih.`
        ];
        return message.reply(winMsgs[Math.floor(Math.random() * winMsgs.length)]);
      } else {
        userData.data.dih.length = Math.max(0, userData.data.dih.length - stolen);
        targetData.data.dih.length += stolen;
        userData.data.dih.stats.losses++;
        targetData.data.dih.stats.wins = (targetData.data.dih.stats.wins || 0) + 1;

        await usersData.set(senderID, { data: userData.data });
        await usersData.set(targetID, { data: targetData.data });

        const loseMsgs = [
          `⚔️ You lost the battle! ${targetData.name || "Unknown"} was too strong and took ${stolen} cm from your dih.`,
          `⚔️ Defeat! Your dih is now ${stolen} cm shorter thanks to ${targetData.name || "Unknown"}.`,
          `⚔️ OUCH! ${targetData.name || "Unknown"} counter-attacked and stole ${stolen} cm of your dih.`
        ];
        return message.reply(loseMsgs[Math.floor(Math.random() * loseMsgs.length)]);
      }

    } else if (command === "stats") {
      const stats = userData.data.dih;
      const winRate = stats.stats.totalAttacks > 0 ? ((stats.stats.wins / stats.stats.totalAttacks) * 100).toFixed(1) : 0;

      const statsMsg = `📊 Your Dih Stats\n\n` +
        `📏 Length: ${stats.length} cm\n` +
        `⚔️ Wins: ${stats.stats.wins}\n` +
        `💀 Losses: ${stats.stats.losses}\n` +
        `🔥 Total Attacks: ${stats.stats.totalAttacks}\n` +
        `📈 Win Rate: ${winRate}%`;

      return message.reply(statsMsg);

    } else if (command === "dotd") {
      const tz = config.TIMEZONE || "Asia/Dhaka";
      const today = moment.tz(tz).format("DD/MM/YYYY");
      const threadData = await threadsData.get(threadID);

      if (!threadData.data) threadData.data = {};

      if (threadData.data.lastDOTD === today) {
        const winner = await usersData.get(threadData.data.dotdWinnerID);
        return message.reply(`Today's Dih of the Day belongs to ${winner.name || "Unknown"}! They already received a bonus of ${threadData.data.dotdBonus} cm.`);
      }

      const members = threadData.members.filter(m => m.inGroup);
      if (members.length === 0) return message.reply("Not enough members to pick a winner!");

      const luckyMember = members[Math.floor(Math.random() * members.length)];
      const bonus = Math.floor(Math.random() * 15) + 5;

      const luckyUserData = await usersData.get(luckyMember.userID);
      if (!luckyUserData.data) luckyUserData.data = {};
      if (!luckyUserData.data.dih) luckyUserData.data.dih = { length: 0, lastGrowth: 0, stats: { wins: 0, losses: 0, totalAttacks: 0 } };

      luckyUserData.data.dih.length += bonus;
      await usersData.set(luckyMember.userID, { data: luckyUserData.data });

      threadData.data.lastDOTD = today;
      threadData.data.dotdWinnerID = luckyMember.userID;
      threadData.data.dotdBonus = bonus;
      await threadsData.set(threadID, { data: threadData.data });

      return message.reply(`🎉 Congratulations ${luckyUserData.name || "Unknown"}! Your dih was chosen as the Dih of the Day!\n\n🎁 You received a bonus of ${bonus} cm! Current length: ${luckyUserData.data.dih.length} cm.`);

    } else {
      return message.reply("Invalid subcommand! Use: grow, top, attack, stats, dotd");
    }
  }
};
