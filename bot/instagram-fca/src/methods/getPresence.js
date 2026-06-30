'use strict';

async function getPresence(callback) {
  try {
    const response = await this.http.get(
      'https://i.instagram.com/api/v1/direct_v2/get_presence/'
    );

    const presence = {};
    const users = response.data?.user_presence || {};

    for (const [userId, data] of Object.entries(users)) {
      presence[userId] = {
        isActive: data.is_active || false,
        lastActivityAt: data.last_activity_at_ms,
        inThreads: data.in_threads || []
      };
    }

    if (callback) callback(null, presence);
    return presence;
  } catch (error) {
    if (callback) callback(error);
    throw error;
  }
}

module.exports = getPresence;
