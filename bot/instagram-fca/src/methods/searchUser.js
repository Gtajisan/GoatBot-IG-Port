'use strict';

const { INSTAGRAM_API } = require('../constants');
const { formatUser } = require('../../utils');

async function searchUser(query, limit = 10, callback) {
  if (typeof limit === 'function') {
    callback = limit;
    limit = 10;
  }

  try {
    const response = await this.http.get(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.USER_SEARCH}`, {
      params: { q: query, count: limit }
    });

    const users = (response.data?.users || []).map(formatUser);

    if (callback) callback(null, users);
    return users;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = searchUser;
