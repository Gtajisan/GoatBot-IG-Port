'use strict';

async function deleteMessage(threadID, messageID, callback) {
  try {
    await this.http.post(`https://i.instagram.com/api/v1/direct_v2/threads/${threadID}/items/${messageID}/delete/`, {
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

module.exports = deleteMessage;
