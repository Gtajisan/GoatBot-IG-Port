'use strict';

async function setThreadName(threadID, name, callback) {
  try {
    await this.http.post(
      `https://i.instagram.com/api/v1/direct_v2/threads/${threadID}/update_title/`,
      {
        title: name,
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

module.exports = setThreadName;
