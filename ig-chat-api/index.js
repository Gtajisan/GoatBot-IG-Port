"use strict";

/**
 * ig-chat-api — Wrapper for @neoaz07/nkxica
 *
 * Provides the same interface as the previous internal API
 * but uses nkxica as the engine.
 */

const { login: nkxicaLogin } = require("@neoaz07/nkxica");
const EventEmitter = require("events");

function login(loginData, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    }

    const globalOptions = {
        listenEvents: true,
        selfListen: false,
        autoMarkDelivery: false,
        autoMarkRead: false,
        autoReconnect: true,
        logLevel: "info",
        userAgent: options.userAgent || "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    };

    nkxicaLogin.setOptions(globalOptions);

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

    const hasCredentials = loginData.username && loginData.password;
    const hasCookies = loginData.appState || (Array.isArray(loginData) && loginData.length > 0);

    (async () => {
        try {
            let ig;
            if (hasCredentials) {
                ig = await nkxicaLogin({ email: loginData.username, password: loginData.password });
            } else if (hasCookies) {
                const appState = loginData.appState || loginData;
                ig = await nkxicaLogin(typeof appState === 'string' ? appState : JSON.stringify(appState));
            } else {
                return callback(new Error("No login credentials provided."));
            }

            const api = buildAPI(ig);
            callback(null, api);
        } catch (err) {
            callback(err);
        }
    })();

    return returnPromise;
}

function buildAPI(ig) {
    const api = new EventEmitter();

    api.setOptions = (opts) => ig.setOptions(opts);
    api.getAppState = () => ig.getAppState ? ig.getAppState() : [];
    api.getCurrentUserID = () => {
        const id = ig.getCurrentUserID();
        return typeof id === 'object' ? (id.userID || id.userId || String(id)) : String(id);
    };

    api.sendMessage = (text, threadID, callback) => {
        const p = ig.sendMessage(text, threadID);
        if (callback) p.then(res => callback(null, res)).catch(err => callback(err));
        return p;
    };

    api.listenMqtt = (callback) => {
        return ig.listen(callback);
    };
    api.listen = api.listenMqtt;

    api.getUserInfo = (userID) => ig.getUserInfo(userID);
    api.getThreadInfo = (threadID) => ig.getThreadInfo(threadID);
    api.markAsRead = (threadID, callback) => {
        const p = ig.markAsRead ? ig.markAsRead(threadID, true) : Promise.resolve();
        if (callback) p.then(res => callback(null, res)).catch(err => callback(err));
        return p;
    };

    api.sendTypingIndicator = (threadID, callback) => {
        const p = ig.sendTypingIndicator ? ig.sendTypingIndicator(threadID) : Promise.resolve();
        if (callback) p.then(res => callback(null, res)).catch(err => callback(err));
        return p;
    };

    api.setMessageReaction = (emoji, messageID, callback) => {
        const p = ig.sendReaction ? ig.sendReaction(emoji, messageID) : Promise.resolve();
        if (callback) p.then(res => callback(null, res)).catch(err => callback(err));
        return p;
    };

    api.unsendMessage = (messageID, callback) => {
        const p = ig.unsendMessage ? ig.unsendMessage(messageID) : Promise.resolve();
        if (callback) p.then(res => callback(null, res)).catch(err => callback(err));
        return p;
    };

    api.logout = (callback) => {
        const p = ig.logout ? ig.logout() : Promise.resolve();
        if (callback) p.then(res => callback(null, res)).catch(err => callback(err));
        return p;
    };

    // Proxied methods
    const methods = [
        'sendPhoto', 'sendVideo', 'sendVoice', 'sendPhotoFromUrl',
        'sendVideoFromUrl', 'sendVoiceFromUrl', 'replyToMessage',
        'getInbox', 'getThreadList', 'getThreadHistory'
    ];

    methods.forEach(method => {
        if (ig[method]) {
            api[method] = (...args) => ig[method](...args);
        }
    });

    return api;
}

module.exports = login;
module.exports.login = login;
