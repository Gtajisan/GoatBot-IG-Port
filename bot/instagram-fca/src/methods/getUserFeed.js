'use strict';

const { INSTAGRAM_API } = require('../constants');

async function getUserFeed(userID, limit = 20, callback) {
  if (typeof limit === 'function') {
    callback = limit;
    limit = 20;
  }

  try {
    const url = INSTAGRAM_API.USER_FEED.replace('{user_id}', userID);
    const response = await this.http.get(`${INSTAGRAM_API.BASE_URL}${url}`, {
      params: { count: limit }
    });

    const posts = (response.data?.items || []).map(item => ({
      mediaID: item.pk,
      code: item.code,
      type: item.media_type,
      caption: item.caption?.text,
      likeCount: item.like_count,
      commentCount: item.comment_count,
      takenAt: item.taken_at
    }));

    if (callback) callback(null, posts);
    return posts;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = getUserFeed;
