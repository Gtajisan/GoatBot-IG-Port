'use strict';

const INSTAGRAM_API = {
  BASE_URL: 'https://i.instagram.com/api/v1',
  WEB_URL: 'https://www.instagram.com',
  LOGIN: '/accounts/login/',
  LOGOUT: '/accounts/logout/',
  SYNC: '/launcher/sync/',
  QESYNC: '/qe/sync/',
  CURRENT_USER: '/accounts/current_user/',
  INBOX: '/direct_v2/inbox/',
  THREADS: '/direct_v2/threads/',
  PENDING_INBOX: '/direct_v2/pending_inbox/',
  APPROVE_PENDING: '/direct_v2/threads/{thread_id}/approve/',
  SEND_MESSAGE: '/direct_v2/threads/broadcast/text/',
  SEND_PHOTO: '/direct_v2/threads/broadcast/upload_photo/',
  SEND_VIDEO: '/direct_v2/threads/broadcast/upload_video/',
  SEND_LINK: '/direct_v2/threads/broadcast/link/',
  SEND_LIKE: '/direct_v2/threads/broadcast/like/',
  MARK_SEEN: '/direct_v2/threads/{thread_id}/items/{item_id}/seen/',
  GET_PRESENCE: '/direct_v2/get_presence/',
  USER_INFO: '/users/{user_id}/info/',
  USER_SEARCH: '/users/search/',
  FRIENDSHIP: '/friendships/show/{user_id}/',
  FOLLOW: '/friendships/create/{user_id}/',
  UNFOLLOW: '/friendships/destroy/{user_id}/',
  BLOCK: '/friendships/block/{user_id}/',
  UNBLOCK: '/friendships/unblock/{user_id}/',
};

module.exports = { INSTAGRAM_API };
