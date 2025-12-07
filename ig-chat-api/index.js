"use strict";

/**
 * ig-chat-api - Instagram Chat API
 * 
 * FCA-compatible wrapper for Instagram Messaging API (Graph API)
 * Drop-in replacement for fb-chat-api / fca-unofficial
 * 
 * Usage:
 *   const login = require("ig-chat-api");
 *   login({ accessToken, igUserID }, (err, api) => {
 *     api.listen((err, event) => { ... });
 *     api.sendMessage("Hello!", threadID);
 *   });
 */

const sendMessage = require("./api/sendMessage");
const listen = require("./api/listen");
const getUserInfo = require("./api/getUserInfo");
const getThreadInfo = require("./api/getThreadInfo");
const getThreadList = require("./api/getThreadList");
const markAsRead = require("./api/markAsRead");
const sendTypingIndicator = require("./api/sendTypingIndicator");
const setMessageReaction = require("./api/setMessageReaction");

const Boolean_Options = [
    "listenEvents",
    "selfListen",
    "autoMarkDelivery",
    "autoMarkRead",
    "autoReconnect",
    "updatePresence"
];

function setOptions(globalOptions, options) {
    Object.keys(options || {}).forEach(key => {
        if (Boolean_Options.includes(key)) {
            globalOptions[key] = Boolean(options[key]);
        } else {
            switch (key) {
                case "logLevel":
                    globalOptions.logLevel = options.logLevel;
                    break;
                case "pageID":
                case "igUserID":
                    globalOptions.pageID = (options.pageID || options.igUserID).toString();
                    break;
                case "accessToken":
                    globalOptions.accessToken = options.accessToken;
                    break;
                case "verifyToken":
                    globalOptions.verifyToken = options.verifyToken;
                    break;
                case "webhookPort":
                    globalOptions.webhookPort = parseInt(options.webhookPort);
                    break;
                default:
                    globalOptions[key] = options[key];
                    break;
            }
        }
    });
}

function buildAPI(ctx) {
    const api = {};
    
    api.setOptions = (options) => setOptions(ctx.globalOptions, options);
    
    api.getAppState = () => ({
        accessToken: ctx.accessToken,
        pageID: ctx.pageID,
        igUserID: ctx.pageID,
        verifyToken: ctx.verifyToken
    });
    
    api.getCurrentUserID = () => ctx.pageID;
    api.getUserID = () => ctx.pageID;
    
    api.sendMessage = sendMessage(ctx);
    api.listen = listen(ctx, api);
    api.listenMqtt = api.listen;
    api.getUserInfo = getUserInfo(ctx);
    api.getThreadInfo = getThreadInfo(ctx);
    api.getThreadList = getThreadList(ctx);
    api.markAsRead = markAsRead(ctx);
    api.markAsDelivered = api.markAsRead;
    api.sendTypingIndicator = sendTypingIndicator(ctx);
    api.setMessageReaction = setMessageReaction(ctx);
    
    api.unsendMessage = (messageID, callback) => {
        console.warn("[ig-chat-api] unsendMessage not supported on Instagram");
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.deleteMessage = api.unsendMessage;
    
    api.changeNickname = (nickname, threadID, participantID, callback) => {
        console.warn("[ig-chat-api] changeNickname not supported on Instagram");
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.changeThreadColor = (color, threadID, callback) => {
        console.warn("[ig-chat-api] changeThreadColor not supported on Instagram");
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.changeThreadEmoji = (emoji, threadID, callback) => {
        console.warn("[ig-chat-api] changeThreadEmoji not supported on Instagram");
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.setTitle = (newTitle, threadID, callback) => {
        console.warn("[ig-chat-api] setTitle not supported on Instagram DMs");
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.addUserToGroup = (userID, threadID, callback) => {
        console.warn("[ig-chat-api] addUserToGroup not supported on Instagram");
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.removeUserFromGroup = (userID, threadID, callback) => {
        console.warn("[ig-chat-api] removeUserFromGroup not supported on Instagram");
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.changeAdminStatus = (threadID, adminIDs, adminStatus, callback) => {
        console.warn("[ig-chat-api] changeAdminStatus not supported on Instagram");
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.logout = (callback) => {
        ctx.loggedIn = false;
        if (ctx.stopListening) ctx.stopListening();
        console.log("[ig-chat-api] Logged out");
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.handleWebhook = null;
    api.verifyWebhook = null;
    
    return api;
}

function login(loginData, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    }
    
    const globalOptions = {
        listenEvents: true,
        selfListen: false,
        autoMarkDelivery: true,
        autoMarkRead: false,
        autoReconnect: true,
        updatePresence: false,
        logLevel: "info",
        webhookPort: 5000
    };
    
    setOptions(globalOptions, options);
    
    let resolveFunc, rejectFunc;
    const returnPromise = new Promise((resolve, reject) => {
        resolveFunc = resolve;
        rejectFunc = reject;
    });
    
    if (typeof callback !== "function") {
        callback = (err, api) => {
            if (err) return rejectFunc(err);
            resolveFunc(api);
        };
    }
    
    const accessToken = loginData.accessToken || 
                        loginData.appState?.accessToken || 
                        process.env.INSTAGRAM_ACCESS_TOKEN ||
                        process.env.IG_ACCESS_TOKEN;
    
    const pageID = loginData.pageID || 
                   loginData.igUserID ||
                   loginData.appState?.pageID ||
                   loginData.appState?.igUserID ||
                   process.env.INSTAGRAM_PAGE_ID ||
                   process.env.IG_USER_ID;
    
    const verifyToken = loginData.verifyToken || 
                        loginData.appState?.verifyToken ||
                        process.env.INSTAGRAM_VERIFY_TOKEN ||
                        process.env.IG_VERIFY_TOKEN ||
                        "goatbot_ig_verify";
    
    if (!accessToken) {
        const error = new Error(
            "Access token is required. Set INSTAGRAM_ACCESS_TOKEN environment variable or pass accessToken in loginData."
        );
        callback(error);
        return returnPromise;
    }
    
    if (!pageID) {
        const error = new Error(
            "Instagram Page/User ID is required. Set INSTAGRAM_PAGE_ID environment variable or pass pageID/igUserID in loginData."
        );
        callback(error);
        return returnPromise;
    }
    
    const ctx = {
        accessToken: accessToken,
        pageID: pageID.toString(),
        verifyToken: verifyToken,
        globalOptions: globalOptions,
        loggedIn: true,
        clientID: Math.random().toString(36).substring(2),
        apiVersion: "v19.0",
        graphApiBase: "https://graph.facebook.com",
        stopListening: null,
        eventEmitter: null
    };
    
    console.log("[ig-chat-api] Initializing Instagram Chat API...");
    console.log(`[ig-chat-api] Page ID: ${ctx.pageID}`);
    console.log(`[ig-chat-api] API Version: ${ctx.apiVersion}`);
    console.log(`[ig-chat-api] Webhook Port: ${ctx.globalOptions.webhookPort}`);
    
    const axios = require("axios");
    
    // Validate token
    axios.get(`${ctx.graphApiBase}/${ctx.apiVersion}/me`, {
        params: {
            access_token: ctx.accessToken,
            fields: "id,name,instagram_business_account"
        }
    })
    .then(response => {
        console.log(`[ig-chat-api] ✓ Connected as: ${response.data.name || response.data.id}`);
        if (response.data.instagram_business_account) {
            console.log(`[ig-chat-api] ✓ Instagram Business Account linked`);
        }
        const api = buildAPI(ctx);
        callback(null, api);
    })
    .catch(error => {
        const errorMsg = error.response?.data?.error?.message || error.message;
        if (error.response?.status === 400 || error.response?.status === 401) {
            console.error("[ig-chat-api] ✗ Invalid access token:", errorMsg);
            callback(new Error(`Invalid access token: ${errorMsg}`));
        } else {
            if (globalOptions.logLevel !== "silent") {
                console.warn("[ig-chat-api] Token validation warning:", errorMsg);
                console.log("[ig-chat-api] Proceeding with provided credentials...");
            }
            const api = buildAPI(ctx);
            callback(null, api);
        }
    });
    
    return returnPromise;
}

module.exports = login;
module.exports.login = login;
