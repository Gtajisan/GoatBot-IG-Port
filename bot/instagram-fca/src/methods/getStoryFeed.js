'use strict';

const { INSTAGRAM_API } = require('../constants');

async function getStoryFeed(callback) {
  try {
    const response = await this.http.get(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.STORY_FEED}`);

    const stories = (response.data?.tray || []).map(item => ({
      userID: item.user?.pk,
      username: item.user?.username,
      hasUnseenMedia: item.has_unseen_media || false,
      latestReelMedia: item.latest_reel_media,
      expiringAt: item.expiring_at
    }));

    if (callback) callback(null, stories);
    return stories;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = getStoryFeed;
