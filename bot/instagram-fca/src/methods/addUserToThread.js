'use strict';

async function addUserToThread(threadID, userIDs, callback) {
  const users = Array.isArray(userIDs) ? userIDs : [userIDs];

  try {
    await this.http.post(
      `https://i.instagram.com/api/v1/direct_v2/threads/${threadID}/add_user/`,
      {
        user_ids: JSON.stringify(users),
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

module.exports = addUserToThread;
