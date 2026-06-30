'use strict';

const { generateMessageID } = require('../../utils');

async function sendLink(url, threadID, text = '', callback) {
  if (typeof text === 'function') {
    callback = text;
    text = '';
  }

  try {
    const response = await this.http.post(
      'https://i.instagram.com/api/v1/direct_v2/threads/broadcast/link/',
      {
        action: 'send_item',
        thread_ids: `[${threadID}]`,
        client_context: generateMessageID(),
        link_text: text,
        link_urls: `["${url}"]`,
        _uuid: this.session.uuid,
        _uid: this.session.userId
      }
    );

    const result = {
      threadID,
      messageID: response.data?.payload?.item_id || generateMessageID(),
      timestamp: Date.now()
    };

    if (callback) callback(null, result);
    return result;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = sendLink;
