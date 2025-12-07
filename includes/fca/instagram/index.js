/**
 * Instagram FCA - Node.js Adapter
 * GoatBot-V2 compatible wrapper for Instagram FCA
 * Bridges Java FCA / Python API to Node.js commands
 */

"use strict";

const axios = require("axios");
const EventEmitter = require("events");
const fs = require("fs-extra");
const path = require("path");

const API_BASE = "http://127.0.0.1:3001";

class InstagramFCA extends EventEmitter {
    constructor(options = {}) {
        super();
        this.loggedIn = false;
        this.userId = null;
        this.username = null;
        this.options = {
            selfListen: false,
            listenEvents: true,
            autoMarkRead: true,
            pollInterval: 5000,
            ...options
        };
        this.processedMessages = new Set();
        this.pollTimer = null;
    }
    
    async request(method, endpoint, data = null) {
        try {
            const config = {
                method,
                url: `${API_BASE}${endpoint}`,
                headers: { "Content-Type": "application/json" },
                timeout: 30000
            };
            if (data && (method === "POST" || method === "PUT")) {
                config.data = data;
            }
            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`[IG-FCA] Request error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    async login(username, password, verificationCode = null) {
        const data = { username, password };
        if (verificationCode) {
            data.verification_code = verificationCode;
        }
        const result = await this.request("POST", "/login", data);
        if (result.success) {
            this.loggedIn = true;
            this.userId = result.user_id;
            this.username = result.username;
            console.log(`[IG-FCA] Logged in as: ${this.username}`);
        }
        return result;
    }
    
    async loginFromSession() {
        const result = await this.request("POST", "/login/session", {});
        if (result.success) {
            this.loggedIn = true;
            this.userId = result.user_id;
            this.username = result.username;
            console.log(`[IG-FCA] Session restored for: ${this.username}`);
        }
        return result;
    }
    
    async getStatus() {
        return await this.request("GET", "/status");
    }
    
    sendMessage(threadId, message, callback) {
        const messageObj = typeof message === "string" ? { body: message } : message;
        
        const sendPromise = (async () => {
            if (messageObj.body) {
                return await this.request("POST", "/send/message", {
                    thread_id: threadId,
                    text: messageObj.body
                });
            }
            if (messageObj.attachment) {
                const attachPath = messageObj.attachment.path || messageObj.attachment;
                if (attachPath.match(/\.(jpg|jpeg|png|gif)$/i)) {
                    return await this.request("POST", "/send/photo", {
                        thread_id: threadId,
                        photo_path: attachPath,
                        caption: messageObj.body || ""
                    });
                }
                if (attachPath.match(/\.(mp4|mov|avi)$/i)) {
                    return await this.request("POST", "/send/video", {
                        thread_id: threadId,
                        video_path: attachPath
                    });
                }
            }
            return { success: false, error: "Invalid message format" };
        })();
        
        if (callback) {
            sendPromise.then(result => callback(null, result)).catch(err => callback(err));
            return;
        }
        return sendPromise;
    }
    
    async getUserInfo(userId, callback) {
        const result = await this.request("GET", `/user/${userId}`);
        if (callback) {
            callback(result.success ? null : result.error, result.success ? { [userId]: result.user } : null);
            return;
        }
        return result.success ? { [userId]: result.user } : null;
    }
    
    async getThreadInfo(threadId, callback) {
        const result = await this.request("GET", `/thread/${threadId}`);
        if (callback) {
            callback(result.success ? null : result.error, result.success ? result.thread : null);
            return;
        }
        return result.success ? result.thread : null;
    }
    
    async getThreadList(limit = 20, callback) {
        const result = await this.request("GET", `/threads?amount=${limit}`);
        if (callback) {
            callback(result.success ? null : result.error, result.success ? result.threads : []);
            return;
        }
        return result.success ? result.threads : [];
    }
    
    getCurrentUserID() {
        return this.userId;
    }
    
    getAppState() {
        return {
            userId: this.userId,
            username: this.username,
            loggedIn: this.loggedIn
        };
    }
    
    setOptions(options) {
        Object.assign(this.options, options);
    }
    
    async startPolling() {
        if (this.pollTimer) return;
        
        const poll = async () => {
            try {
                const result = await this.request("GET", "/messages/pending");
                if (result.success && result.messages) {
                    for (const msg of result.messages) {
                        if (!this.processedMessages.has(msg.id)) {
                            this.processedMessages.add(msg.id);
                            
                            if (!this.options.selfListen && msg.user_id === this.userId) {
                                continue;
                            }
                            
                            const event = {
                                type: "message",
                                messageID: msg.id,
                                threadID: msg.thread_id,
                                senderID: msg.user_id,
                                body: msg.text || "",
                                timestamp: msg.timestamp,
                                isGroup: false,
                                attachments: []
                            };
                            
                            this.emit("message", event);
                        }
                    }
                }
            } catch (error) {
                console.error(`[IG-FCA] Poll error: ${error.message}`);
            }
        };
        
        this.pollTimer = setInterval(poll, this.options.pollInterval);
        poll();
        console.log("[IG-FCA] Started message polling");
    }
    
    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
    
    listen(callback) {
        this.on("message", (event) => {
            callback(null, event);
        });
        this.startPolling();
        return () => this.stopPolling();
    }
    
    listenMqtt(callback) {
        return this.listen(callback);
    }
    
    markAsRead(threadId, callback) {
        if (callback) callback(null);
        return Promise.resolve();
    }
    
    markAsDelivered(threadId, callback) {
        if (callback) callback(null);
        return Promise.resolve();
    }
    
    sendTypingIndicator(threadId, callback) {
        if (callback) callback(null);
        return Promise.resolve();
    }
    
    setMessageReaction(messageId, reaction, threadId, callback) {
        if (callback) callback(null);
        return Promise.resolve();
    }
    
    unsendMessage(messageId, callback) {
        console.warn("[IG-FCA] unsendMessage not supported on Instagram");
        if (callback) callback(null);
        return Promise.resolve();
    }
    
    changeNickname(nickname, threadId, participantId, callback) {
        console.warn("[IG-FCA] changeNickname not supported on Instagram");
        if (callback) callback(null);
        return Promise.resolve();
    }
    
    logout(callback) {
        this.stopPolling();
        this.loggedIn = false;
        this.userId = null;
        this.username = null;
        console.log("[IG-FCA] Logged out");
        if (callback) callback(null);
        return Promise.resolve();
    }
}

async function login(credentials, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    }
    
    const fca = new InstagramFCA(options);
    
    try {
        let result;
        
        if (credentials.session || credentials.appState) {
            result = await fca.loginFromSession();
        } else if (credentials.username && credentials.password) {
            result = await fca.login(credentials.username, credentials.password, credentials.verificationCode);
        } else {
            result = await fca.loginFromSession();
        }
        
        if (result.success) {
            if (callback) callback(null, fca);
            return fca;
        } else {
            const error = new Error(result.message || result.error || "Login failed");
            if (callback) callback(error);
            throw error;
        }
    } catch (error) {
        if (callback) callback(error);
        throw error;
    }
}

module.exports = login;
module.exports.InstagramFCA = InstagramFCA;
module.exports.login = login;
