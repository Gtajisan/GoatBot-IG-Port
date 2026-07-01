'use strict';

/**
 * Instagram-FCA API Class
 * Main API class with all Instagram functionality
 *
 * @author Gtajisan <ffjisan804@gmail.com>
 * @github https://github.com/Gtajisan
 */

const EventEmitter = require('events');
const WebSocket = require('ws');

const log = require('../lib/logger');
const { INSTAGRAM_API } = require('./constants');

// Import API methods
const sendMessage = require('./methods/sendMessage');
const getThreadList = require('./methods/getThreadList');
const getThreadInfo = require('./methods/getThreadInfo');
const getUserInfo = require('./methods/getUserInfo');
const searchUser = require('./methods/searchUser');
const sendTypingIndicator = require('./methods/sendTypingIndicator');
const markAsRead = require('./methods/markAsRead');
const markAsUnread = require('./methods/markAsUnread');
const deleteMessage = require('./methods/deleteMessage');
const unsendMessage = require('./methods/unsendMessage');
const reactMessage = require('./methods/reactMessage');
const followUser = require('./methods/followUser');
const unfollowUser = require('./methods/unfollowUser');
const blockUser = require('./methods/blockUser');
const unblockUser = require('./methods/unblockUser');
const getFriendship = require('./methods/getFriendship');
const getTimeline = require('./methods/getTimeline');
const getUserFeed = require('./methods/getUserFeed');
const getStoryFeed = require('./methods/getStoryFeed');
const likeMedia = require('./methods/likeMedia');
const unlikeMedia = require('./methods/unlikeMedia');
const commentMedia = require('./methods/commentMedia');
const deleteComment = require('./methods/deleteComment');
const saveMedia = require('./methods/saveMedia');
const unsaveMedia = require('./methods/unsaveMedia');
const sendPhoto = require('./methods/sendPhoto');
const sendVideo = require('./methods/sendVideo');
const sendLink = require('./methods/sendLink');
const sendLike = require('./methods/sendLike');
const createThread = require('./methods/createThread');
const leaveThread = require('./methods/leaveThread');
const addUserToThread = require('./methods/addUserToThread');
const removeUserFromThread = require('./methods/removeUserFromThread');
const setThreadName = require('./methods/setThreadName');
const setThreadPhoto = require('./methods/setThreadPhoto');
const muteThread = require('./methods/muteThread');
const unmuteThread = require('./methods/unmuteThread');
const approvePendingThread = require('./methods/approvePendingThread');
const getPendingThreads = require('./methods/getPendingThreads');
const getPresence = require('./methods/getPresence');
const listen = require('./methods/listen');

class API extends EventEmitter {
  constructor(session, httpClient, options = {}) {
    super();

    this.session = session;
    this.http = httpClient;
    this.options = options;

    // Current user info
    this.currentUserId = null;
    this.currentUsername = null;

    // Listener state
    this.isListening = false;
    this.listenerConnection = null;
    this.listenerInterval = null;

    // Health tracking
    this.startTime = Date.now();
    this.ackCount = 0;
    this.ackLatencies = [];
    this.deliveryStats = {
      attempts: 0,
      success: 0,
      failed: 0,
      timeouts: 0
    };

    // Backoff options
    this.backoffOptions = {
      base: 1000,
      factor: 2,
      max: 300000,
      jitter: true
    };

    // Edit options for message editing
    this.editOptions = {
      maxPendingEdits: 10,
      editTTLms: 300000,
      ackTimeoutMs: 10000,
      maxResendAttempts: 3
    };

    // Bind all API methods
    this._bindMethods();
  }

  /**
   * Bind all API methods to this instance
   */
  _bindMethods() {
    // Messaging
    this.sendMessage = sendMessage.bind(this);
    this.sendPhoto = sendPhoto.bind(this);
    this.sendVideo = sendVideo.bind(this);
    this.sendLink = sendLink.bind(this);
    this.sendLike = sendLike.bind(this);
    this.deleteMessage = deleteMessage.bind(this);
    this.unsendMessage = unsendMessage.bind(this);
    this.reactMessage = reactMessage.bind(this);
    this.sendTypingIndicator = sendTypingIndicator.bind(this);

    // Thread operations
    this.getThreadList = getThreadList.bind(this);
    this.getThreadInfo = getThreadInfo.bind(this);
    this.createThread = createThread.bind(this);
    this.leaveThread = leaveThread.bind(this);
    this.addUserToThread = addUserToThread.bind(this);
    this.removeUserFromThread = removeUserFromThread.bind(this);
    this.setThreadName = setThreadName.bind(this);
    this.setThreadPhoto = setThreadPhoto.bind(this);
    this.muteThread = muteThread.bind(this);
    this.unmuteThread = unmuteThread.bind(this);
    this.markAsRead = markAsRead.bind(this);
    this.markAsUnread = markAsUnread.bind(this);
    this.approvePendingThread = approvePendingThread.bind(this);
    this.getPendingThreads = getPendingThreads.bind(this);

    // User operations
    this.getUserInfo = getUserInfo.bind(this);
    this.searchUser = searchUser.bind(this);
    this.followUser = followUser.bind(this);
    this.unfollowUser = unfollowUser.bind(this);
    this.blockUser = blockUser.bind(this);
    this.unblockUser = unblockUser.bind(this);
    this.getFriendship = getFriendship.bind(this);
    this.getPresence = getPresence.bind(this);

    // Feed operations
    this.getTimeline = getTimeline.bind(this);
    this.getUserFeed = getUserFeed.bind(this);
    this.getStoryFeed = getStoryFeed.bind(this);

    // Media operations
    this.likeMedia = likeMedia.bind(this);
    this.unlikeMedia = unlikeMedia.bind(this);
    this.commentMedia = commentMedia.bind(this);
    this.deleteComment = deleteComment.bind(this);
    this.saveMedia = saveMedia.bind(this);
    this.unsaveMedia = unsaveMedia.bind(this);

    // Listener
    this.listen = listen.bind(this);
  }

  /**
   * Set current user info
   */
  setCurrentUser(userId, username) {
    this.currentUserId = userId;
    this.currentUsername = username;
    this.session.userId = userId;
    this.session.username = username;
  }

  /**
   * Get current user ID (fca compatible)
   * @returns {string} Current user ID
   */
  getCurrentUserID() {
    return this.currentUserId;
  }

  /**
   * Get current user info
   * @returns {Object} Current user info
   */
  getCurrentUser() {
    return {
      id: this.currentUserId,
      username: this.currentUsername
    };
  }

  /**
   * Get appState for session persistence
   * @returns {Array} AppState cookies
   */
  getAppState() {
    return this.session.getAppState();
  }

  /**
   * Save appState to file
   * @param {string} filePath - Path to save appState
   */
  saveAppState(filePath) {
    this.session.saveAppState(filePath);
  }

  /**
   * Set edit options for message editing
   * @param {Object} options - Edit options
   */
  setEditOptions(options) {
    this.editOptions = { ...this.editOptions, ...options };
  }

  /**
   * Set backoff options for retry logic
   * @param {Object} options - Backoff options
   */
  setBackoffOptions(options) {
    this.backoffOptions = { ...this.backoffOptions, ...options };
  }

  /**
   * Enable/disable lazy preflight
   * @param {boolean} enabled - Whether to enable lazy preflight
   */
  enableLazyPreflight(enabled) {
    this.options.lazyPreflight = enabled;
  }

  /**
   * Get health metrics
   * @returns {Object} Health metrics
   */
  getHealthMetrics() {
    const sessionMetrics = this.session.getHealthMetrics();
    const p95Index = Math.floor(this.ackLatencies.length * 0.95);
    const sortedLatencies = [...this.ackLatencies].sort((a, b) => a - b);

    return {
      ...sessionMetrics,
      uptime: Date.now() - this.startTime,
      ackCount: this.ackCount,
      p95AckLatencyMs: sortedLatencies[p95Index] || 0,
      isListening: this.isListening,
      deliveryAttempts: this.deliveryStats.attempts,
      deliverySuccess: this.deliveryStats.success,
      deliveryFailed: this.deliveryStats.failed,
      deliveryTimeouts: this.deliveryStats.timeouts
    };
  }

  /**
   * Get memory metrics
   * @returns {Object} Memory metrics
   */
  getMemoryMetrics() {
    return {
      ...this.session.getMemoryMetrics(),
      pendingMessages: 0,
      ackLatencyQueueSize: this.ackLatencies.length
    };
  }

  /**
   * Stop listening
   */
  stopListening() {
    this.isListening = false;

    if (this.listenerInterval) {
      clearInterval(this.listenerInterval);
      this.listenerInterval = null;
    }

    if (this.listenerConnection) {
      this.listenerConnection.close();
      this.listenerConnection = null;
    }

    log.info('Stopped listening');
    this.emit('stop');
  }

  /**
   * Logout and clear session
   */
  async logout() {
    try {
      await this.http.post(`${INSTAGRAM_API.BASE_URL}/accounts/logout/`, {
        _uuid: this.session.uuid,
        _uid: this.session.userId
      });
    } catch (error) {
      log.warn('Logout error:', error.message);
    }

    this.stopListening();
    this.session.clear();
    this.emit('logout');
  }

  /**
   * Record ACK latency
   * @param {number} latency - Latency in ms
   */
  recordAckLatency(latency) {
    this.ackCount++;
    this.ackLatencies.push(latency);

    // Keep only last 1000 latencies
    if (this.ackLatencies.length > 1000) {
      this.ackLatencies.shift();
    }
  }

  /**
   * Record delivery attempt
   * @param {string} status - 'success', 'failed', or 'timeout'
   */
  recordDelivery(status) {
    this.deliveryStats.attempts++;
    if (status === 'success') this.deliveryStats.success++;
    else if (status === 'failed') this.deliveryStats.failed++;
    else if (status === 'timeout') this.deliveryStats.timeouts++;
  }
}

module.exports = API;
