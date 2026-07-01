const fs = require("fs-extra");

module.exports = {
  config: {
    name: "checkPremiumExpiry",
    version: "1.0",
    author: "NeoKEX",
    category: "events"
  },

  async run({ bot, database, logger }) {
    // This event is usually triggered on ready or periodically
    // For this port, we check on ready
    const config = bot.config;
    const premiumUsers = config.PREMIUM_USERS || [];
    const now = Date.now();
    let changed = false;

    // The current config doesn't have expiry dates for premiumUsers,
    // but V2 database sometimes does. Check database first.
    const allUsers = database.getAllUsers();
    for (const user of allUsers) {
      if (user.premium && user.premium.expiry && user.premium.expiry < now) {
        user.premium.isPremium = false;
        database.updateUser(user.userID, user);

        const idx = premiumUsers.indexOf(user.userID);
        if (idx > -1) {
          premiumUsers.splice(idx, 1);
          changed = true;
        }
        logger.info(`Premium expired for user: ${user.userID}`);
      }
    }

    if (changed) {
      // Potentially update config file if needed
    }
  }
};
