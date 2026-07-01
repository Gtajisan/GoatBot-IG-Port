'use strict';

const { INSTAGRAM_API } = require('../constants');
const { formatThread } = require('../../utils');

async function getThreadList(limit = 20, cursor = null, callback) {
  if (typeof limit === 'function') {
    callback = limit;
    limit = 20;
  }

  try {
    const params = { limit };
    if (cursor) params.cursor = cursor;

    const response = await this.http.get(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.INBOX}`, { params });

    const threads = (response.data?.inbox?.threads || []).map(formatThread);
    const result = {
      threads,
      cursor: response.data?.inbox?.oldest_cursor,
      hasMore: response.data?.inbox?.has_older
    };

    if (callback) callback(null, result);
    return result;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = getThreadList;
