'use strict';

async function muteThread(threadID, duration = 0, callback) {
  if (typeof duration === 'function') {
    callback = duration;
    duration = 0;
  }

  try {
    await this.http.post(
      `https://i.instagram.com/api/v1/direct_v2/threads/${threadID}/mute/`,
      {
        mute_until: duration || -1,
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

module.exports = muteThread;
