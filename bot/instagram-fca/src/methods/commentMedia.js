'use strict';

const { INSTAGRAM_API } = require('../constants');

async function commentMedia(mediaID, text, callback) {
  try {
    const url = INSTAGRAM_API.COMMENT.replace('{media_id}', mediaID);
    const response = await this.http.post(`${INSTAGRAM_API.BASE_URL}${url}`, {
      _uuid: this.session.uuid,
      _uid: this.session.userId,
      comment_text: text
    });

    const result = {
      commentID: response.data?.comment?.pk,
      text: response.data?.comment?.text
    };

    if (callback) callback(null, result);
    return result;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = commentMedia;
