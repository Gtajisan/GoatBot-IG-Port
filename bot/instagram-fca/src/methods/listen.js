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
  log.info('Starting message listener (Recursive Polling with Aging support)...');

  const pollInterval = this.options.listenInterval || 3000;
  let lastSeenTimestamp = Date.now() * 1000;
  const seenItems = new Set();
  let consecutiveErrors = 0;
  let timer = null;

  const poll = async () => {
    if (!this.isListening) return;

    try {
      const response = await this.http.get(`${INSTAGRAM_API.BASE_URL}/direct_v2/inbox/`, {
          params: {
              persistentBadging: 'true',
              use_unified_inbox: 'true'
          }
      });

      consecutiveErrors = 0;

      if (response.data?.inbox?.threads) {
        for (const thread of response.data.inbox.threads) {
          const items = thread.items || [];
          for (const item of items) {
            const itemTimestamp = parseInt(item.timestamp);
            const itemID = String(item.item_id);

            if (itemTimestamp >= lastSeenTimestamp && !seenItems.has(itemID)) {
              if (itemTimestamp > lastSeenTimestamp) {
                  lastSeenTimestamp = itemTimestamp;
                  if (seenItems.size > 1000) {
                      const arr = Array.from(seenItems);
                      arr.slice(0, 500).forEach(id => seenItems.delete(id));
                  }
              }
              seenItems.add(itemID);

              if (!this.options.selfListen && item.user_id == this.currentUserId) {
                continue;
              }

              const event = {
                type: 'message',
                threadID: String(thread.thread_id),
                messageID: itemID,
                senderID: String(item.user_id),
                body: item.text || '',
                timestamp: itemTimestamp,
                isGroup: !!thread.is_group,
                attachments: [],
                mentions: {}
              };

              if (item.media) {
                  event.attachments.push({
                      type: item.media.media_type === 1 ? 'photo' : 'video',
                      url: item.media.image_versions2?.candidates?.[0]?.url || item.media.video_versions?.[0]?.url
                  });
              }

              if (this.options.autoMarkRead) {
                this.markAsRead(thread.thread_id, itemID).catch(() => {});
              }

              this.emit('message', event);
              if (callback) callback(null, event);
            }
          }
        }
      }

      // Schedule next poll
      if (this.isListening) {
          timer = setTimeout(poll, pollInterval);
      }
    } catch (error) {
      consecutiveErrors++;
      log.error('Listen error:', error.message);

      if (consecutiveErrors >= 20) {
        log.warn('Too many consecutive listen errors. Stopping listener and propagating error.');
        this.isListening = false;
        if (callback) callback(error);
        this.emit('error', error);
        return;
      }

      // Exponential backoff or simple delay on error
      const backoff = Math.min(pollInterval * Math.pow(1.5, consecutiveErrors), 60000);
      if (this.isListening) {
          timer = setTimeout(poll, backoff);
      }
    }
  };

  // Start polling
  poll();

  this.emit('listen');
  log.info('Listener started successfully');

  this.stopListening = () => {
      this.isListening = false;
      if (timer) clearTimeout(timer);
      log.info('Listener stopped');
  };

  return this.stopListening;
}

module.exports = listen;
