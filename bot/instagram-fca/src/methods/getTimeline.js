'use strict';

const { INSTAGRAM_API } = require('../constants');

async function getTimeline(limit = 20, callback) {
  if (typeof limit === 'function') {
    callback = limit;
    limit = 20;
  }

  try {
    const response = await this.http.get(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.TIMELINE}`, {
      params: { reason: 'cold_start_fetch', is_pull_to_refresh: false }
    });

    const posts = (response.data?.feed_items || []).map(item => ({
      mediaID: item.media_or_ad?.pk,
      code: item.media_or_ad?.code,
      type: item.media_or_ad?.media_type,
      caption: item.media_or_ad?.caption?.text,
      user: item.media_or_ad?.user ? {
        userID: item.media_or_ad.user.pk,
        username: item.media_or_ad.user.username
      } : null,
      likeCount: item.media_or_ad?.like_count,
      commentCount: item.media_or_ad?.comment_count
    })).filter(p => p.mediaID);

    if (callback) callback(null, posts);
    return posts;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = getTimeline;
