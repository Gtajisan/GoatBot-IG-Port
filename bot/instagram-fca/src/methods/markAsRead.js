'use strict';

const { INSTAGRAM_API } = require('../constants');

async function markAsRead(threadID, itemID, callback) {
  try {
    const url = INSTAGRAM_API.MARK_SEEN
      .replace('{thread_id}', threadID)
      .replace('{item_id}', itemID);

    await this.http.post(`${INSTAGRAM_API.BASE_URL}${url}`, {
      _uuid: this.session.uuid,
      _uid: this.session.userId,
      action: 'mark_seen',
      thread_id: threadID,
      item_id: itemID
    });

    if (callback) callback(null);
    return true;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = markAsRead;
