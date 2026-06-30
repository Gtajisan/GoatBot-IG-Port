'use strict';

const { INSTAGRAM_API } = require('../constants');

async function deleteComment(mediaID, commentID, callback) {
  try {
    const url = INSTAGRAM_API.DELETE_COMMENT
      .replace('{media_id}', mediaID)
      .replace('{comment_id}', commentID);

    await this.http.post(`${INSTAGRAM_API.BASE_URL}${url}`, {
      _uuid: this.session.uuid,
      _uid: this.session.userId
    });

    if (callback) callback(null);
    return true;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = deleteComment;
