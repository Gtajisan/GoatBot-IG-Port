'use strict';

const { INSTAGRAM_API } = require('../constants');

async function saveMedia(mediaID, callback) {
  try {
    const url = INSTAGRAM_API.SAVE_MEDIA.replace('{media_id}', mediaID);
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

module.exports = saveMedia;
