'use strict';

const { INSTAGRAM_API } = require('../constants');

async function getFriendship(userID, callback) {
  try {
    const url = INSTAGRAM_API.FRIENDSHIP.replace('{user_id}', userID);
    const response = await this.http.get(`${INSTAGRAM_API.BASE_URL}${url}`);

    const result = {
      following: response.data?.following || false,
      followedBy: response.data?.followed_by || false,
      blocking: response.data?.blocking || false,
      muting: response.data?.muting || false,
      isPrivate: response.data?.is_private || false,
      incomingRequest: response.data?.incoming_request || false,
      outgoingRequest: response.data?.outgoing_request || false
    };

    if (callback) callback(null, result);
    return result;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = getFriendship;
