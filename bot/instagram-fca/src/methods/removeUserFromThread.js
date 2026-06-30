'use strict';

async function removeUserFromThread(threadID, userID, callback) {
  try {
    await this.http.post(
      `https://i.instagram.com/api/v1/direct_v2/threads/${threadID}/remove_users/`,
      {
        user_ids: JSON.stringify([userID]),
        _uuid: this.session.uuid,
        _uid: this.session.userId
      }
    );

    if (callback) callback(null);
    return true;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = removeUserFromThread;
