'use strict';

const { formatThread } = require('../../utils');

async function getPendingThreads(limit = 20, callback) {
  if (typeof limit === 'function') {
    callback = limit;
    limit = 20;
  }

  try {
    const response = await this.http.get(
      'https://i.instagram.com/api/v1/direct_v2/pending_inbox/',
      { params: { limit } }
    );

    const threads = (response.data?.inbox?.threads || []).map(formatThread);

    if (callback) callback(null, threads);
    return threads;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = getPendingThreads;
