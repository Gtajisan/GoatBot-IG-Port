'use strict';

async function unmuteThread(threadID, callback) {
  try {
    await this.http.post(
      `https://i.instagram.com/api/v1/direct_v2/threads/${threadID}/unmute/`,
      {
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

module.exports = unmuteThread;
