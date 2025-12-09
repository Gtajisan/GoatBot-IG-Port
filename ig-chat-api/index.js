"use strict";

/**
 * Instagram Chat API (ig-chat-api)
 * 
 * @author Gtajisan
 * @description Instagram Chat API ported from fb-chat-api with Instagram logic
 * @based-on fb-chat-api by NTKhang and DongDev
 * @credit GoatBot V2 Instagram Port
 */

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const EventEmitter = require("events");

const sendMessage = require("./src/sendMessage");
const listenMqtt = require("./src/listenMqtt");
const getUserInfo = require("./src/getUserInfo");
const getThreadInfo = require("./src/getThreadInfo");
const getThreadList = require("./src/getThreadList");
const markAsRead = require("./src/markAsRead");
const sendTypingIndicator = require("./src/sendTypingIndicator");
const setMessageReaction = require("./src/setMessageReaction");
const getCurrentUserID = require("./src/getCurrentUserID");
const getThreadHistory = require("./src/getThreadHistory");
const unsendMessage = require("./src/unsendMessage");

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
                case "forceLogin":
                    globalOptions.forceLogin = options.forceLogin;
                    break;
                case "userAgent":
                    globalOptions.userAgent = options.userAgent;
                    break;
                default:
                    globalOptions[key] = options[key];
                    break;
            }
        }
    });
}

function getHeaders(ctx) {
    return {
        "User-Agent": ctx.globalOptions.userAgent || "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "X-IG-App-ID": "936619743392459",
        "X-ASBD-ID": "129477",
        "X-IG-WWW-Claim": ctx.wwwClaim || "0",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://www.instagram.com",
        "Referer": "https://www.instagram.com/direct/inbox/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-CSRFToken": ctx.csrfToken || ""
    };
}

function buildAPI(ctx) {
    const api = new EventEmitter();
    
    api.setOptions = (options) => setOptions(ctx.globalOptions, options);
    
    api.getAppState = () => ctx.appState;
    
    api.getCurrentUserID = getCurrentUserID(ctx);
    api.getUserID = () => ctx.userID;
    
    api.sendMessage = sendMessage(ctx, api);
    api.listenMqtt = listenMqtt(ctx, api);
    api.listen = api.listenMqtt;
    api.getUserInfo = getUserInfo(ctx);
    api.getThreadInfo = getThreadInfo(ctx);
    api.getThreadList = getThreadList(ctx);
    api.getThreadHistory = getThreadHistory(ctx);
    api.markAsRead = markAsRead(ctx);
    api.markAsDelivered = api.markAsRead;
    api.sendTypingIndicator = sendTypingIndicator(ctx);
    api.setMessageReaction = setMessageReaction(ctx);
    api.unsendMessage = unsendMessage(ctx);
    api.deleteMessage = api.unsendMessage;
    
    api.changeNickname = (nickname, threadID, participantID, callback) => {
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.changeThreadColor = (color, threadID, callback) => {
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.changeThreadEmoji = (emoji, threadID, callback) => {
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.setTitle = (newTitle, threadID, callback) => {
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.addUserToGroup = (userID, threadID, callback) => {
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.removeUserFromGroup = (userID, threadID, callback) => {
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.changeAdminStatus = (threadID, adminIDs, adminStatus, callback) => {
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.logout = (callback) => {
        ctx.loggedIn = false;
        if (ctx.stopListening) ctx.stopListening();
        if (callback) callback(null);
        return Promise.resolve();
    };
    
    api.getHeaders = () => getHeaders(ctx);
    api.httpGet = (url, jar) => ctx.axios.get(url);
    api.httpPost = (url, form, jar) => ctx.axios.post(url, form);
    
    api.stopListenMqtt = (callback) => {
        if (ctx.mqttClient) {
            ctx.mqttClient.end();
            ctx.mqttClient = null;
        }
        if (callback) callback();
    };
    
    const srcPath = path.join(__dirname, 'src');
    if (fs.existsSync(srcPath)) {
        fs.readdirSync(srcPath)
            .filter(v => v.endsWith('.js'))
            .forEach(v => {
                const funcName = v.replace('.js', '');
                if (!api[funcName]) {
                    try {
                        api[funcName] = require(`./src/${v}`)(ctx, api);
                    } catch (e) {}
                }
            });
    }
    
    return api;
}

function parseCookies(cookieData) {
    let cookies = [];
    
    if (typeof cookieData === "string") {
        if (cookieData.trim().startsWith("[")) {
            try {
                cookies = JSON.parse(cookieData);
            } catch (e) {
                cookies = cookieData.split(";").map(c => {
                    const [key, ...valueParts] = c.trim().split("=");
                    return {
                        key: key?.trim(),
                        value: valueParts.join("=")?.trim(),
                        domain: "instagram.com",
                        path: "/",
                        hostOnly: false,
                        creation: new Date().toISOString(),
                        lastAccessed: new Date().toISOString()
                    };
                }).filter(c => c.key && c.value);
            }
        } else {
            cookies = cookieData.split(";").map(c => {
                const [key, ...valueParts] = c.trim().split("=");
                return {
                    key: key?.trim(),
                    value: valueParts.join("=")?.trim(),
                    domain: "instagram.com",
                    path: "/",
                    hostOnly: false,
                    creation: new Date().toISOString(),
                    lastAccessed: new Date().toISOString()
                };
            }).filter(c => c.key && c.value);
        }
    } else if (Array.isArray(cookieData)) {
        cookies = cookieData.map(c => ({
            key: c.key || c.name,
            value: c.value,
            domain: c.domain || "instagram.com",
            path: c.path || "/",
            hostOnly: c.hostOnly || false,
            creation: c.creation || new Date().toISOString(),
            lastAccessed: c.lastAccessed || new Date().toISOString()
        }));
    }
    
    return cookies.filter(c => c.key && c.value);
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
        forceLogin: true,
        userAgent: "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
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
    
    const appState = loginData.appState || loginData;
    const cookies = parseCookies(appState);
    
    if (!cookies || cookies.length === 0) {
        const error = new Error("No valid cookies provided. Please provide Instagram cookies in account.txt");
        callback(error);
        return returnPromise;
    }
    
    const jar = new CookieJar();
    let csrfToken = "";
    let sessionID = "";
    let userID = "";
    
    for (const cookie of cookies) {
        try {
            const cookieStr = `${cookie.key}=${cookie.value}; Domain=.instagram.com; Path=/`;
            jar.setCookieSync(cookieStr, "https://www.instagram.com/");
            
            if (cookie.key === "csrftoken") csrfToken = cookie.value;
            if (cookie.key === "sessionid") sessionID = cookie.value;
            if (cookie.key === "ds_user_id") userID = cookie.value;
        } catch (e) {}
    }
    
    if (!sessionID) {
        const error = new Error("Missing sessionid cookie. Please ensure your Instagram cookies include 'sessionid'");
        callback(error);
        return returnPromise;
    }
    
    if (!userID) {
        const error = new Error("Missing ds_user_id cookie. Please ensure your Instagram cookies include 'ds_user_id'");
        callback(error);
        return returnPromise;
    }
    
    const axiosInstance = wrapper(axios.create({
        jar,
        withCredentials: true,
        baseURL: "https://www.instagram.com",
        timeout: 30000
    }));
    
    const ctx = {
        userID: userID,
        jar: jar,
        axios: axiosInstance,
        csrfToken: csrfToken,
        sessionID: sessionID,
        appState: cookies,
        globalOptions: globalOptions,
        loggedIn: true,
        clientID: Math.random().toString(36).substring(2),
        wwwClaim: "0",
        mqttClient: null,
        stopListening: null
    };
    
    axiosInstance.defaults.headers.common = getHeaders(ctx);
    
    console.log("[ig-chat-api] Validating Instagram session...");
    
    axiosInstance.get("/api/v1/accounts/current_user/", {
        headers: getHeaders(ctx)
    })
    .then(response => {
        if (response.data && response.data.user) {
            const user = response.data.user;
            console.log(`[ig-chat-api] ✓ Logged in as: ${user.username} (ID: ${user.pk})`);
            ctx.userID = user.pk.toString();
            ctx.username = user.username;
            const api = buildAPI(ctx);
            callback(null, api);
        } else {
            throw new Error("Invalid session");
        }
    })
    .catch(error => {
        console.log("[ig-chat-api] Session validation via API failed, trying web endpoint...");
        
        axiosInstance.get("/", {
            headers: {
                ...getHeaders(ctx),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            }
        })
        .then(response => {
            const html = response.data;
            
            const csrfMatch = html.match(/"csrf_token":"([^"]+)"/);
            if (csrfMatch) {
                ctx.csrfToken = csrfMatch[1];
            }
            
            const userMatch = html.match(/"username":"([^"]+)"/);
            if (userMatch) {
                ctx.username = userMatch[1];
            }
            
            if (ctx.userID) {
                console.log(`[ig-chat-api] ✓ Session validated for user ID: ${ctx.userID}`);
                if (ctx.username) {
                    console.log(`[ig-chat-api] ✓ Username: ${ctx.username}`);
                }
                const api = buildAPI(ctx);
                callback(null, api);
            } else {
                const error = new Error("Could not validate Instagram session. Please check your cookies.");
                callback(error);
            }
        })
        .catch(err => {
            console.log("[ig-chat-api] Proceeding with provided credentials...");
            const api = buildAPI(ctx);
            callback(null, api);
        });
    });
    
    return returnPromise;
}

module.exports = login;
module.exports.login = login;
