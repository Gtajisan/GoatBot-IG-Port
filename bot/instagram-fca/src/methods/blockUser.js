'use strict';

const { INSTAGRAM_API } = require('../constants');

async function blockUser(userID, callback) {
  try {
    const url = INSTAGRAM_API.BLOCK.replace('{user_id}', userID);
    await this.http.post(`${INSTAGRAM_API.BASE_URL}${url}`, {
      _uuid: this.session.uuid,
      _uid: this.session.userId,
      user_id: userID
    });

    if (callback) callback(null);
    return true;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = blockUser;
