'use strict';

const { INSTAGRAM_API } = require('../constants');

async function sendTypingIndicator(threadID, isTyping = true, callback) {
  try {
    await this.http.post(`${INSTAGRAM_API.BASE_URL}/direct_v2/threads/${threadID}/activity/`, {
      activity_status: isTyping ? '1' : '0',
      _uuid: this.session.uuid
    });

    if (callback) callback(null);
    return true;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = sendTypingIndicator;
