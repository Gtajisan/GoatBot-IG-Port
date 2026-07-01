'use strict';

const { INSTAGRAM_API } = require('../constants');
const { generateMessageID } = require('../../utils');

async function sendMessage(text, threadID, callback, replyToMessageID) {
  const startTime = Date.now();

  // Handle GoatBot V2 form object: { body, attachment }
  let messageText = text;
  let attachment = null;

  if (typeof text === 'object' && text !== null) {
      messageText = text.body || '';
      attachment = text.attachment;
  }

  // If there is an attachment but no sendPhoto/sendVideo implemented for this flow yet,
  // we log a warning but proceed with text.
  if (attachment) {
      if (Array.isArray(attachment)) {
          // GoatBot sometimes sends array of attachments
          // For now we just use the first one if we were to implement media sending here
      }
  }

  try {
    const payload = {
      action: 'send_item',
      thread_ids: `[${threadID}]`,
      client_context: generateMessageID(),
      text: String(messageText),
      _uuid: this.session.uuid,
      _uid: this.session.userId
    };

    if (replyToMessageID) {
        payload.replied_to_item_id = String(replyToMessageID);
    }

    const response = await this.http.post(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.SEND_MESSAGE}`, payload);

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
