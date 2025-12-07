
/**
 * platform/ig-wrapper.js
 * Minimal wrapper to plug ig-chat-api into GoatBot V2 with minimal changes.
 */
require('dotenv').config();
const login = require('../ig-chat-api');

module.exports = function startIGBot(existingHandler) {
  const api = login({
    accessToken: process.env.IG_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN || 'DUMMY',
    igUserID: process.env.IG_USER_ID || process.env.INSTAGRAM_PAGE_ID || 'DUMMY',
    port: process.env.PORT || 5000,
    verifyToken: process.env.IG_VERIFY_TOKEN || process.env.INSTAGRAM_VERIFY_TOKEN || 'verifytoken'
  });

  api.on('message', (evt) => {
    try {
      if (typeof existingHandler === 'function') {
        existingHandler(evt);
      } else if (global.goatOnMessage) {
        global.goatOnMessage(evt);
      } else {
        console.log('IG event (no handler found):', evt);
      }
    } catch (err) {
      console.error('Error in Goat handler:', err);
    }
  });

  api.listen();
  return api;
};
