'use strict';

/**
 * Utility functions for Instagram-FCA
 *
 * @author Gtajisan <ffjisan804@gmail.com>
 * @github https://github.com/Gtajisan
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Format delta (similar to fca)
 * @param {Object} delta - Delta object
 * @param {Object} options - Options
 * @returns {Object} Formatted delta
 */
function formatDelta(delta, options = {}) {
  return {
    type: delta.type || 'message',
    threadID: delta.threadId || delta.thread_id,
    messageID: delta.itemId || delta.item_id,
    body: delta.text || delta.body || '',
    senderID: delta.userId || delta.user_id,
    timestamp: delta.timestamp || Date.now(),
    isGroup: delta.isGroup !== false,
    attachments: delta.attachments || [],
    mentions: delta.mentions || {},
    isUnread: delta.isUnread !== false
  };
}

/**
 * Get type of attachment
 * @param {Object} attachment - Attachment object
 * @returns {string} Attachment type
 */
function getAttachmentType(attachment) {
  if (!attachment) return 'unknown';

  const type = attachment.type || attachment.item_type;

  switch (type) {
    case 'photo':
    case 'image':
      return 'photo';
    case 'video':
    case 'clip':
      return 'video';
    case 'voice_media':
    case 'audio':
      return 'audio';
    case 'animated_media':
    case 'sticker':
      return 'sticker';
    case 'link':
    case 'url':
      return 'share';
    case 'reel_share':
      return 'reel';
    case 'story_share':
      return 'story';
    case 'felix_share':
      return 'igtv';
    default:
      return type || 'unknown';
  }
}

/**
 * Parse message ID from various formats
 * @param {string|Object} input - Message ID or object
 * @returns {string} Message ID
 */
function parseMessageID(input) {
  if (typeof input === 'string') return input;
  if (typeof input === 'object') {
    return input.messageID || input.message_id || input.item_id || input.id;
  }
  return String(input);
}

/**
 * Parse thread ID from various formats
 * @param {string|Object} input - Thread ID or object
 * @returns {string} Thread ID
 */
function parseThreadID(input) {
  if (typeof input === 'string') return input;
  if (typeof input === 'object') {
    return input.threadID || input.thread_id || input.id;
  }
  return String(input);
}

/**
 * Parse user ID from various formats
 * @param {string|Object} input - User ID or object
 * @returns {string} User ID
 */
function parseUserID(input) {
  if (typeof input === 'string') return input;
  if (typeof input === 'object') {
    return input.userID || input.user_id || input.pk || input.id;
  }
  return String(input);
}

/**
 * Generate random message ID
 * @returns {string} Message ID
 */
function generateMessageID() {
  return `${Date.now()}${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Generate random request ID
 * @returns {string} Request ID
 */
function generateRequestID() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Delay execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Read file as buffer
 * @param {string} filePath - Path to file
 * @returns {Buffer} File buffer
 */
function readFileBuffer(filePath) {
  return fs.readFileSync(filePath);
}

/**
 * Get file extension
 * @param {string} filePath - Path to file
 * @returns {string} File extension
 */
function getFileExtension(filePath) {
  return path.extname(filePath).toLowerCase().slice(1);
}

/**
 * Get MIME type from extension
 * @param {string} ext - File extension
 * @returns {string} MIME type
 */
function getMimeType(ext) {
  const types = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4'
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Check if file is image
 * @param {string} filePath - Path to file
 * @returns {boolean} True if image
 */
function isImage(filePath) {
  const ext = getFileExtension(filePath);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
}

/**
 * Check if file is video
 * @param {string} filePath - Path to file
 * @returns {boolean} True if video
 */
function isVideo(filePath) {
  const ext = getFileExtension(filePath);
  return ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
}

/**
 * Format thread for output
 * @param {Object} thread - Thread object
 * @returns {Object} Formatted thread
 */
function formatThread(thread) {
  return {
    threadID: thread.thread_id || thread.pk,
    name: thread.thread_title || thread.name,
    isGroup: thread.is_group || (thread.users?.length > 1),
    participants: (thread.users || []).map(u => ({
      userID: u.pk || u.id,
      username: u.username,
      fullName: u.full_name,
      profilePic: u.profile_pic_url
    })),
    unreadCount: thread.read_state || 0,
    lastMessage: thread.last_permanent_item ? {
      messageID: thread.last_permanent_item.item_id,
      body: thread.last_permanent_item.text,
      timestamp: thread.last_permanent_item.timestamp
    } : null,
    lastActivity: thread.last_activity_at,
    muted: thread.muted || false,
    isApproved: thread.pending !== true
  };
}

/**
 * Format user for output
 * @param {Object} user - User object
 * @returns {Object} Formatted user
 */
function formatUser(user) {
  return {
    userID: user.pk || user.id,
    username: user.username,
    fullName: user.full_name,
    profilePic: user.profile_pic_url || user.hd_profile_pic_url_info?.url,
    isPrivate: user.is_private || false,
    isVerified: user.is_verified || false,
    bio: user.biography,
    followerCount: user.follower_count,
    followingCount: user.following_count,
    postCount: user.media_count,
    externalUrl: user.external_url
  };
}

/**
 * Format message for output
 * @param {Object} message - Message object
 * @returns {Object} Formatted message
 */
function formatMessage(message) {
  return {
    messageID: message.item_id || message.id,
    threadID: message.thread_id,
    senderID: message.user_id,
    body: message.text || '',
    timestamp: message.timestamp,
    type: message.item_type || 'text',
    reactions: (message.reactions?.emojis || []).map(r => ({
      emoji: r.emoji,
      senderID: r.sender_id
    })),
    attachments: formatAttachments(message),
    replyTo: message.replied_to_message?.item_id || null,
    isUnsent: message.is_shh_mode || false
  };
}

/**
 * Format attachments from message
 * @param {Object} message - Message object
 * @returns {Array} Formatted attachments
 */
function formatAttachments(message) {
  const attachments = [];

  if (message.media) {
    const media = message.media;
    attachments.push({
      type: media.media_type === 1 ? 'photo' : 'video',
      url: media.image_versions2?.candidates?.[0]?.url || media.video_versions?.[0]?.url,
      width: media.original_width,
      height: media.original_height
    });
  }

  if (message.voice_media) {
    attachments.push({
      type: 'audio',
      url: message.voice_media.media?.audio?.audio_src,
      duration: message.voice_media.media?.audio?.duration
    });
  }

  if (message.animated_media) {
    attachments.push({
      type: 'sticker',
      url: message.animated_media.images?.fixed_height?.url
    });
  }

  if (message.link) {
    attachments.push({
      type: 'share',
      url: message.link.text,
      title: message.link.link_context?.link_title
    });
  }

  return attachments;
}

module.exports = {
  formatDelta,
  getAttachmentType,
  parseMessageID,
  parseThreadID,
  parseUserID,
  generateMessageID,
  generateRequestID,
  delay,
  readFileBuffer,
  getFileExtension,
  getMimeType,
  isImage,
  isVideo,
  formatThread,
  formatUser,
  formatMessage,
  formatAttachments
};
