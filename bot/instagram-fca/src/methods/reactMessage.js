'use strict';

async function reactMessage(threadID, messageID, emoji, callback) {
  try {
    await this.http.post(`https://i.instagram.com/api/v1/direct_v2/threads/${threadID}/items/${messageID}/reactions/`, {
      reaction_type: 'like',
      reaction_status: emoji ? 'created' : 'deleted',
      emoji: emoji || '',
      _uuid: this.session.uuid
    });

    if (callback) callback(null);
    return true;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = reactMessage;
