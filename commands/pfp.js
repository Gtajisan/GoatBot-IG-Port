const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

module.exports = {
  config: {
    name: 'pfp',
    aliases: ['avatar', 'profilepic'],
    description: "Fetch user's profile picture",
    usage: 'pfp [username | @username | link | reply | @tag]',
    cooldown: 5,
    role: 0,
    category: 'utility'
  },

  async onStart({ api, event, args, logger, database }) {
    try {
      let targetInput = null;
      let isUid = false;

      if (args.length > 0) {
        const input = args[0].trim();
        if (input.includes('instagram.com/')) {
          const match = input.match(/instagram\.com\/([^/?#&]+)/);
          if (match) targetInput = match[1];
        } else {
          targetInput = input.replace(/^@+/, '');
        }
      }
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetInput = Object.keys(event.mentions)[0];
        isUid = true;
      }
      else if (event.replyToItemId) {
          // This would need message info from DB usually, but for now we try to get it from reply event if possible
          // In this bot, we might not have the full reply object unless we fetched it
          return api.sendMessage('❌ Reply parsing not fully supported yet. Please use username or tag.', event.threadId);
      }
      else {
        targetInput = event.senderID;
        isUid = true;
      }

      if (!targetInput) return api.sendMessage('❌ Could not identify a user.', event.threadId);
      if (!isUid && /^\d+$/.test(targetInput)) isUid = true;

      const cacheKey = `${isUid ? 'uid' : 'user'}:${targetInput}`;
      if (cache.has(cacheKey)) {
        const { data, timestamp } = cache.get(cacheKey);
        if (Date.now() - timestamp < CACHE_TTL) {
          return this.sendProfile(api, event, data, logger);
        }
      }

      api.sendMessage('🔍 Fetching profile picture...', event.threadId);

      let userInfo;
      if (isUid) {
          const infoObj = await api.getUserInfo(targetInput);
          userInfo = infoObj[targetInput];
      } else {
          userInfo = await api.getUserInfoByUsername(targetInput);
      }

      if (!userInfo) {
        return api.sendMessage(`❌ User ${isUid ? targetInput : '@' + targetInput} not found or account is private.`, event.threadId);
      }

      cache.set(cacheKey, { data: userInfo, timestamp: Date.now() });
      return this.sendProfile(api, event, userInfo, logger);

    } catch (error) {
      logger.error('Error in pfp command', { error: error.message });
      return api.sendMessage(`❌ Error: ${error.message}`, event.threadId);
    }
  },

  async sendProfile(api, event, userInfo, logger) {
    const userId = userInfo.userID || userInfo.userId || userInfo.pk;
    const username = userInfo.username;
    const fullName = userInfo.fullName || userInfo.full_name || 'N/A';
    const isPrivate = userInfo.isPrivate ? '🔒 Private' : '🔓 Public';
    const isVerified = userInfo.isVerified ? '✅ Verified' : '❌ Not Verified';

    const pfpUrl = userInfo.profilePicUrlHd || userInfo.profile_pic_url_hd || userInfo.profile_pic_url;

    if (!pfpUrl) return api.sendMessage('❌ Could not find a profile picture URL.', event.threadId);

    let caption = `👤 Username: @${username}\n`;
    caption += `📝 Full Name: ${fullName}\n`;
    caption += `🆔 User ID: ${userId}\n`;
    caption += `🛡️ Status: ${isPrivate} | ${isVerified}\n`;
    caption += `🔗 Profile: https://instagram.com/${username}`;

    try {
        await api.sendMessage({ body: caption, attachment: pfpUrl }, event.threadId);
    } catch (error) {
        api.sendMessage(`${caption}\n\n🖼️ PFP URL: ${pfpUrl}`, event.threadId);
    }
  }
};
