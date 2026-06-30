'use strict';

async function unsendMessage(threadID, messageID, callback) {
  return this.deleteMessage(threadID, messageID, callback);
}

module.exports = unsendMessage;
