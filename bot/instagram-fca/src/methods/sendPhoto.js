'use strict';

const fs = require('fs');
const FormData = require('form-data');
const { generateMessageID, getMimeType, getFileExtension } = require('../../utils');

async function sendPhoto(photoPath, threadID, callback) {
  try {
    const form = new FormData();
    const photoBuffer = fs.readFileSync(photoPath);
    const ext = getFileExtension(photoPath);

    form.append('photo', photoBuffer, {
      filename: `photo.${ext}`,
      contentType: getMimeType(ext)
    });
    form.append('thread_ids', `[${threadID}]`);
    form.append('client_context', generateMessageID());
    form.append('_uuid', this.session.uuid);

    const response = await this.http.post(
      'https://i.instagram.com/api/v1/direct_v2/threads/broadcast/upload_photo/',
      form,
      { headers: form.getHeaders() }
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

module.exports = sendPhoto;
