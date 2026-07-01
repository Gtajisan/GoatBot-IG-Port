'use strict';

const { INSTAGRAM_API } = require('../constants');
const { formatThread } = require('../../utils');

async function getThreadInfo(threadID, callback) {
  try {
    const response = await this.http.get(
      `${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.THREADS}${threadID}/`,
      { params: { limit: 20 } }
    );

    const thread = response.data?.thread ? formatThread(response.data.thread) : null;

    if (callback) callback(null, thread);
    return thread;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = getThreadInfo;
