'use strict';

const fs = require('fs');
const FormData = require('form-data');

async function setThreadPhoto(threadID, photoPath, callback) {
  try {
    const form = new FormData();
    form.append('photo', fs.createReadStream(photoPath));
    form.append('_uuid', this.session.uuid);

    await this.http.post(
      `https://i.instagram.com/api/v1/direct_v2/threads/${threadID}/update_thread_photo/`,
      form,
      { headers: form.getHeaders() }
    );

    if (callback) callback(null);
    return true;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = setThreadPhoto;
