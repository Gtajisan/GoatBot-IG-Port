"use strict";

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const EventEmitter = require("events");

const sendMessage      = require("./src/sendMessage");
const listenMqtt       = require("./src/listenMqtt");
const getUserInfo      = require("./src/getUserInfo");
const getThreadInfo    = require("./src/getThreadInfo");
const getThreadList    = require("./src/getThreadList");
const getThreadHistory = require("./src/getThreadHistory");
const markAsRead       = require("./src/markAsRead");
const sendTypingIndicator = require("./src/sendTypingIndicator");
const setMessageReaction  = require("./src/setMessageReaction");
const getCurrentUserID    = require("./src/getCurrentUserID");
const unsendMessage       = require("./src/unsendMessage");

/* ─────────────────────────────────────────────
   Instagram Web API constants
───────────────────────────────────────────── */
const IG_APP_ID    = "936619743392459";
const IG_BASE_URL  = "https://www.instagram.com";

function buildHeaders(ctx) {
    return {
        "User-Agent"        : ctx.globalOptions.userAgent,
        "Accept"            : "*/*",
        "Accept-Language"   : "en-US,en;q=0.9",
        "Accept-Encoding"   : "gzip, deflate, br",
        "X-IG-App-ID"       : IG_APP_ID,
        "X-ASBD-ID"         : "129477",
        "X-IG-WWW-Claim"    : ctx.wwwClaim || "0",
        "X-Requested-With"  : "XMLHttpRequest",
        "X-CSRFToken"       : ctx.csrfToken || "",
        "Origin"            : IG_BASE_URL,
        "Referer"           : `${IG_BASE_URL}/direct/inbox/`,
        "Sec-Fetch-Dest"    : "empty",
        "Sec-Fetch-Mode"    : "cors",
        "Sec-Fetch-Site"    : "same-origin"
    };
}

function setOptions(globalOptions, options) {
    const boolKeys = ["listenEvents","selfListen","autoMarkDelivery","autoMarkRead","autoReconnect","updatePresence"];
    Object.keys(options || {}).forEach(key => {
        if (boolKeys.includes(key)) {
            globalOptions[key] = Boolean(options[key]);
        } else {
            globalOptions[key] = options[key];
        }
    });
}

function buildAPI(ctx) {
    const api = new EventEmitter();

    api.setOptions          = (opts)  => setOptions(ctx.globalOptions, opts);
    api.getAppState         = ()      => ctx.appState;
    api.getHeaders          = ()      => buildHeaders(ctx);
    api.getCurrentUserID    = getCurrentUserID(ctx);
    api.getUserID           = ()      => ctx.userID;

    api.sendMessage         = sendMessage(ctx, api);
    api.listenMqtt          = listenMqtt(ctx, api);
    api.listen              = api.listenMqtt;
    api.getUserInfo         = getUserInfo(ctx);
    api.getThreadInfo       = getThreadInfo(ctx);
    api.getThreadList       = getThreadList(ctx);
    api.getThreadHistory    = getThreadHistory(ctx);
    api.markAsRead          = markAsRead(ctx);
    api.markAsDelivered     = api.markAsRead;
    api.sendTypingIndicator = sendTypingIndicator(ctx);
    api.setMessageReaction  = setMessageReaction(ctx);
    api.unsendMessage       = unsendMessage(ctx);
    api.deleteMessage       = api.unsendMessage;

    api.changeNickname = (nickname, threadID, participantID, cb) => {
        const payload = new URLSearchParams({ nickname, thread_id: threadID, participant_user_id: participantID }).toString();
        ctx.axios.post(`/api/v1/direct_v2/threads/${threadID}/update_title/`, payload, {
            headers: { ...buildHeaders(ctx), "Content-Type": "application/x-www-form-urlencoded" }
        }).catch(() => {});
        if (cb) cb(null);
        return Promise.resolve();
    };

    api.setTitle = (newTitle, threadID, cb) => {
        const payload = new URLSearchParams({ title: newTitle }).toString();
        ctx.axios.post(`/api/v1/direct_v2/threads/${threadID}/update_title/`, payload, {
            headers: { ...buildHeaders(ctx), "Content-Type": "application/x-www-form-urlencoded" }
        }).catch(() => {});
        if (cb) cb(null);
        return Promise.resolve();
    };

    api.addUserToGroup = (userID, threadID, cb) => {
        const payload = new URLSearchParams({ user_ids: JSON.stringify([userID.toString()]) }).toString();
        ctx.axios.post(`/api/v1/direct_v2/threads/${threadID}/add_user/`, payload, {
            headers: { ...buildHeaders(ctx), "Content-Type": "application/x-www-form-urlencoded" }
        }).catch(() => {});
        if (cb) cb(null);
        return Promise.resolve();
    };

    api.removeUserFromGroup = (userID, threadID, cb) => {
        const payload = new URLSearchParams({ user_ids: JSON.stringify([userID.toString()]) }).toString();
        ctx.axios.post(`/api/v1/direct_v2/threads/${threadID}/remove_users/`, payload, {
            headers: { ...buildHeaders(ctx), "Content-Type": "application/x-www-form-urlencoded" }
        }).catch(() => {});
        if (cb) cb(null);
        return Promise.resolve();
    };

    api.changeAdminStatus = (threadID, adminIDs, adminStatus, cb) => {
        if (cb) cb(null);
        return Promise.resolve();
    };

    api.changeThreadColor = (color, threadID, cb) => {
        if (cb) cb(null);
        return Promise.resolve();
    };

    api.changeThreadEmoji = (emoji, threadID, cb) => {
        if (cb) cb(null);
        return Promise.resolve();
    };

    api.logout = (cb) => {
        ctx.loggedIn = false;
        if (ctx.stopListening) ctx.stopListening();
        if (cb) cb(null);
        return Promise.resolve();
    };

    api.httpGet  = (url) => ctx.axios.get(url, { headers: buildHeaders(ctx) });
    api.httpPost = (url, data) => ctx.axios.post(url, data, { headers: buildHeaders(ctx) });

    api.stopListenMqtt = (cb) => {
        if (ctx.stopListening) ctx.stopListening();
        if (cb) cb();
    };

    api.refreshFb_dtsg = () => Promise.resolve();

    const srcPath = path.join(__dirname, "src");
    if (fs.existsSync(srcPath)) {
        fs.readdirSync(srcPath)
            .filter(v => v.endsWith(".js"))
            .forEach(v => {
                const name = v.replace(".js", "");
                if (!api[name]) {
                    try { api[name] = require(`./src/${v}`)(ctx, api); } catch (e) {}
                }
            });
    }

    return api;
}

function parseCookies(cookieData) {
    let raw = [];
    if (typeof cookieData === "string") {
        const trimmed = cookieData.trim();
        if (trimmed.startsWith("[")) {
            try { raw = JSON.parse(trimmed); } catch (e) {}
        } else {
            raw = trimmed.split(";").map(c => {
                const [k, ...v] = c.trim().split("=");
                return { name: k?.trim(), value: v.join("=")?.trim() };
            });
        }
    } else if (Array.isArray(cookieData)) {
        raw = cookieData;
    }

    return raw.map(c => ({
        key   : c.key || c.name,
        value : c.value,
        domain: (c.domain || ".instagram.com").replace(/^\.?/, "."),
        path  : c.path || "/",
        hostOnly : c.hostOnly || false,
        creation : c.creation || new Date().toISOString(),
        lastAccessed: c.lastAccessed || new Date().toISOString()
    })).filter(c => c.key && c.value);
}

function login(loginData, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options  = {};
    }

    const globalOptions = {
        listenEvents      : true,
        selfListen        : false,
        autoMarkDelivery  : false,
        autoMarkRead      : false,
        autoReconnect     : true,
        updatePresence    : false,
        logLevel          : "info",
        forceLogin        : true,
        userAgent         : "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    };

    setOptions(globalOptions, options || {});

    let resolveFunc, rejectFunc;
    const returnPromise = new Promise((resolve, reject) => {
        resolveFunc = resolve;
        rejectFunc  = reject;
    });

    if (typeof callback !== "function") {
        callback = (err, api) => {
            if (err) return rejectFunc(err);
            resolveFunc(api);
        };
    }

    const appState = loginData.appState || loginData;
    const cookies  = parseCookies(appState);

    if (!cookies.length) {
        return callback(new Error("No valid cookies found in account.txt")), returnPromise;
    }

    let csrfToken = "", sessionID = "", userID = "";
    const jar = new CookieJar();

    for (const c of cookies) {
        try {
            jar.setCookieSync(`${c.key}=${c.value}; Domain=.instagram.com; Path=/; Secure`, "https://www.instagram.com");
        } catch (e) {}
        if (c.key === "csrftoken") csrfToken = c.value;
        if (c.key === "sessionid") sessionID = c.value;
        if (c.key === "ds_user_id") userID   = c.value;
    }

    if (!sessionID) return callback(new Error("Missing 'sessionid' cookie in account.txt")), returnPromise;
    if (!userID)    return callback(new Error("Missing 'ds_user_id' cookie in account.txt")), returnPromise;

    const axiosInstance = wrapper(axios.create({
        jar,
        withCredentials : true,
        baseURL         : IG_BASE_URL,
        timeout         : 30000,
        maxRedirects    : 5
    }));

    const ctx = {
        userID,
        username  : "",
        jar,
        axios     : axiosInstance,
        csrfToken,
        sessionID,
        appState  : cookies,
        globalOptions,
        loggedIn  : true,
        clientID  : Math.random().toString(36).substring(2),
        wwwClaim  : "0",
        stopListening: null
    };

    const headers = buildHeaders(ctx);
    axiosInstance.defaults.headers.common = headers;

    console.log("[ig-chat-api] Validating Instagram session...");

    const tryValidate = async () => {
        const endpoints = [
            { url: "/api/v1/accounts/current_user/?edit=true", extract: (d) => d?.user?.pk?.toString() },
            { url: "/api/v1/direct_v2/inbox/?limit=1",         extract: (d) => d?.inbox ? userID : null },
            { url: "/api/v1/news/inbox/",                       extract: (d) => d?.status === "ok" ? userID : null }
        ];

        for (const ep of endpoints) {
            try {
                const r = await axiosInstance.get(ep.url, { headers: buildHeaders(ctx) });
                const uid = ep.extract(r.data);
                if (uid) {
                    if (r.data?.user?.username) ctx.username = r.data.user.username;
                    if (uid !== userID) ctx.userID = uid;
                    return true;
                }
            } catch (e) {
                if (e.response?.status === 401 || e.response?.status === 403) {
                    return false;
                }
            }
        }

        console.log("[ig-chat-api] Warning: Could not fully validate session, proceeding anyway...");
        return true;
    };

    tryValidate().then(ok => {
        if (!ok) {
            return callback(new Error("Instagram session is invalid or expired. Please update your cookies in account.txt."));
        }
        console.log(`[ig-chat-api] ✓ Session OK — userID: ${ctx.userID}${ctx.username ? " (@" + ctx.username + ")" : ""}`);
        const api = buildAPI(ctx);
        callback(null, api);
    }).catch(err => {
        console.log("[ig-chat-api] Proceeding with provided session (validation error)...");
        const api = buildAPI(ctx);
        callback(null, api);
    });

    return returnPromise;
}

module.exports = login;
module.exports.login = login;
