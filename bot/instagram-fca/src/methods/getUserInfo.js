'use strict';

const { INSTAGRAM_API } = require('../constants');
const { formatUser } = require('../../utils');

async function getUserInfo(userID, callback) {
  try {
    const url = INSTAGRAM_API.USER_INFO.replace('{user_id}', userID);
    const response = await this.http.get(`${INSTAGRAM_API.BASE_URL}${url}`);

    const user = response.data?.user ? formatUser(response.data.user) : null;

    if (callback) callback(null, user);
    return user;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = getUserInfo;
