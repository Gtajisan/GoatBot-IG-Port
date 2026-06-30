'use strict';

const { generateMessageID } = require('../../utils');

async function createThread(userIDs, message = '', callback) {
  if (typeof message === 'function') {
    callback = message;
    message = '';
  }

  const recipientUsers = Array.isArray(userIDs) ? userIDs : [userIDs];

  try {
    const response = await this.http.post(
      'https://i.instagram.com/api/v1/direct_v2/threads/broadcast/text/',
      {
        action: 'send_item',
        recipient_users: JSON.stringify(recipientUsers),
        client_context: generateMessageID(),
        text: message || 'Hello!',
        _uuid: this.session.uuid,
        _uid: this.session.userId
      }
    );

    const result = {
      threadID: response.data?.payload?.thread_id,
      messageID: response.data?.payload?.item_id,
      timestamp: Date.now()
    };

    if (callback) callback(null, result);
    return result;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = createThread;
