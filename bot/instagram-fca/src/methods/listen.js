'use strict';

const { INSTAGRAM_API } = require('../constants');
const log = require('../../lib/logger');
const { formatMessage } = require('../../utils');

async function listen(callback) {
  if (this.isListening) {
    log.warn('Already listening');
    return;
  }

  this.isListening = true;
  log.info('Starting message listener...');

  const pollInterval = this.options.listenInterval || 3000;
  let lastSeenTimestamp = Date.now() * 1000;
  let consecutiveErrors = 0;

  const poll = async () => {
    if (!this.isListening) return;

    try {
      const response = await this.http.get(`${INSTAGRAM_API.BASE_URL}${INSTAGRAM_API.INBOX}`, {
        params: {
          persistentBadging: true,
          folder: '',
          limit: 20,
          thread_message_limit: 10
        }
      });

      consecutiveErrors = 0;

      if (response.data?.inbox?.threads) {
        for (const thread of response.data.inbox.threads) {
          const items = thread.items || [];
          for (const item of items) {
            const itemTimestamp = parseInt(item.timestamp);
            if (itemTimestamp > lastSeenTimestamp) {
              lastSeenTimestamp = itemTimestamp;

              if (!this.options.selfListen && item.user_id == this.currentUserId) {
                continue;
              }

              const event = {
                type: 'message',
                threadID: thread.thread_id,
                messageID: item.item_id,
                senderID: String(item.user_id),
                body: item.text || '',
                timestamp: itemTimestamp,
                isGroup: thread.is_group,
                attachments: [],
                mentions: {}
              };

              if (this.options.autoMarkRead) {
                this.markAsRead(thread.thread_id, item.item_id).catch(() => {});
              }

              this.emit('message', event);
              if (callback) callback(null, event);
            }
          }
        }
      }
    } catch (error) {
      consecutiveErrors++;
      log.error('Listen error:', error.message);

      if (consecutiveErrors >= 5 && this.options.autoReconnect) {
        log.warn('Too many errors, reconnecting...');
        this.session.recordReconnect();
        consecutiveErrors = 0;
      }

      if (callback) callback(error);
      this.emit('error', error);
    }
  };

  await poll();
  this.listenerInterval = setInterval(poll, pollInterval);

  this.emit('listen');
  log.info('Listener started successfully');

  return this.stopListening.bind(this);
}

module.exports = listen;
