'use strict';

const { INSTAGRAM_API } = require('../constants');
const { generateMessageID } = require('../../utils');

async function sendMessage(text, threadID, callback) {
  const startTime = Date.now();

  try {
    const response = await this.http.post(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.SEND_MESSAGE}`, {
      action: 'send_item',
      thread_ids: `[${threadID}]`,
      client_context: generateMessageID(),
      text: text,
      _uuid: this.session.uuid,
      _uid: this.session.userId
    });

    this.recordAckLatency(Date.now() - startTime);
    this.recordDelivery('success');

    const result = {
      threadID,
      messageID: response.data.payload?.item_id || generateMessageID(),
      timestamp: Date.now()
    };

    if (callback) callback(null, result);
    return result;
  } catch (error) {
    this.recordDelivery('failed');
    if (callback) callback(error);
    throw error;
  }
}

module.exports = sendMessage;
