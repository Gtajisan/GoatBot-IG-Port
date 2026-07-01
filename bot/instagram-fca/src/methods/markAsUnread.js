'use strict';

async function markAsUnread(threadID, callback) {
  try {
    await this.http.post(`https://i.instagram.com/api/v1/direct_v2/threads/${threadID}/mark_unread/`, {
      _uuid: this.session.uuid
    });

    if (callback) callback(null);
    return true;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = markAsUnread;
