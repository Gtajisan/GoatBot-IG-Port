"use strict";

/**
 * Instagram Chat API - Utils
 * @author Gtajisan
 * @ported from fb-chat-api with Instagram logic
 */

const axios = require("axios");
const stream = require("stream");
const querystring = require("querystring");

const defaultUserAgent = "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

let proxyAgent = null;

function setProxy(proxy) {
    if (proxy) {
        try {
            const HttpsProxyAgent = require('https-proxy-agent');
            proxyAgent = new HttpsProxyAgent(proxy);
        } catch (e) {
            proxyAgent = null;
        }
    } else {
        proxyAgent = null;
    }
}

function getType(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}

function isReadableStream(obj) {
    return obj instanceof stream.Stream && typeof obj._read === "function";
}

function formatCookiesForRequest(cookies) {
    if (Array.isArray(cookies)) {
        return cookies.map(c => `${c.key || c.name}=${c.value}`).join("; ");
    }
    return cookies;
}

function generateOfflineThreadingID() {
    const ret = Date.now();
    const value = Math.floor(Math.random() * 4294967295);
    const str = ("0000000000000000000000" + value.toString(2)).slice(-22);
    const msgs = ret.toString(2) + str;
    return binaryToDecimal(msgs);
}

function binaryToDecimal(data) {
    let ret = "";
    while (data !== "0") {
        let end = 0;
        let fullName = "";
        for (let i = 0; i < data.length; i++) {
            end = 2 * end + parseInt(data[i], 10);
            if (end >= 10) {
                fullName += "1";
                end -= 10;
            } else {
                fullName += "0";
            }
        }
        ret = end.toString() + ret;
        data = fullName.slice(fullName.indexOf("1"));
    }
    return ret;
}

function generateThreadingID(clientID) {
    const k = Date.now();
    const l = Math.floor(Math.random() * 4294967295);
    const m = clientID;
    return "<" + k + ":" + l + "-" + m + "@instagram.com>";
}

function getGUID() {
    let sectionLength = Date.now();
    const id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        const r = Math.floor((sectionLength + Math.random() * 16) % 16);
        sectionLength = Math.floor(sectionLength / 16);
        const _guid = (c === "x" ? r : (r & 7) | 8).toString(16);
        return _guid;
    });
    return id;
}

function formatID(id) {
    if (id && typeof id === "string") {
        return id.replace("fbid:", "").trim();
    }
    return id?.toString() || "";
}

async function get(url, cookies, headers = {}, options = {}) {
    try {
        const config = {
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': options.userAgent || defaultUserAgent,
                'Cookie': cookies,
                ...headers
            },
            timeout: 30000
        };
        
        if (proxyAgent) {
            config.httpsAgent = proxyAgent;
        }
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function post(url, cookies, form, headers = {}, options = {}) {
    try {
        const config = {
            method: 'POST',
            url: url,
            headers: {
                'User-Agent': options.userAgent || defaultUserAgent,
                'Cookie': cookies,
                'Content-Type': 'application/x-www-form-urlencoded',
                ...headers
            },
            data: querystring.stringify(form),
            timeout: 30000
        };
        
        if (proxyAgent) {
            config.httpsAgent = proxyAgent;
        }
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function postFormData(url, cookies, formData, headers = {}, options = {}) {
    try {
        const FormData = require('form-data');
        const form = new FormData();
        
        for (const key in formData) {
            form.append(key, formData[key]);
        }
        
        const config = {
            method: 'POST',
            url: url,
            headers: {
                'User-Agent': options.userAgent || defaultUserAgent,
                'Cookie': cookies,
                ...form.getHeaders(),
                ...headers
            },
            data: form,
            timeout: 60000
        };
        
        if (proxyAgent) {
            config.httpsAgent = proxyAgent;
        }
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        throw error;
    }
}

function formatDeltaMessage(delta) {
    const messageMetadata = delta.delta.messageMetadata || {};
    
    return {
        type: "message",
        senderID: formatID(messageMetadata.actorFbId || delta.delta.senderId),
        body: delta.delta.body || "",
        threadID: formatID(messageMetadata.threadKey?.threadFbId || messageMetadata.threadKey?.otherUserFbId),
        messageID: messageMetadata.messageId,
        attachments: formatAttachments(delta.delta.attachments || []),
        mentions: formatMentions(delta.delta.data?.prng || []),
        timestamp: messageMetadata.timestamp,
        isGroup: !!messageMetadata.threadKey?.threadFbId
    };
}

function formatAttachments(attachments) {
    return attachments.map(att => {
        const mercury = att.mercury || att;
        
        if (mercury.attach_type === "photo" || mercury.blob_attachment?.__typename === "MessageImage") {
            return {
                type: "photo",
                ID: mercury.metadata?.fbid || mercury.blob_attachment?.legacy_attachment_id,
                url: mercury.large_preview?.uri || mercury.url,
                width: mercury.original_dimensions?.x,
                height: mercury.original_dimensions?.y,
                filename: mercury.filename
            };
        }
        
        if (mercury.attach_type === "video" || mercury.blob_attachment?.__typename === "MessageVideo") {
            return {
                type: "video",
                ID: mercury.metadata?.fbid || mercury.blob_attachment?.legacy_attachment_id,
                url: mercury.playable_url || mercury.url,
                width: mercury.original_dimensions?.x,
                height: mercury.original_dimensions?.y,
                duration: mercury.playable_duration_in_ms,
                filename: mercury.filename
            };
        }
        
        if (mercury.attach_type === "audio" || mercury.blob_attachment?.__typename === "MessageAudio") {
            return {
                type: "audio",
                ID: mercury.url_shimhash,
                url: mercury.playable_url || mercury.url,
                duration: mercury.playable_duration_in_ms,
                filename: mercury.filename
            };
        }
        
        if (mercury.attach_type === "sticker" || mercury.sticker_attachment) {
            const sticker = mercury.sticker_attachment || mercury;
            return {
                type: "sticker",
                ID: sticker.id,
                url: sticker.url,
                packID: sticker.pack?.id,
                width: sticker.width,
                height: sticker.height
            };
        }
        
        return {
            type: "file",
            ID: mercury.metadata?.fbid,
            url: mercury.url,
            filename: mercury.filename || mercury.name,
            mimeType: mercury.mimeType
        };
    });
}

function formatMentions(prng) {
    if (!prng || !Array.isArray(prng)) return {};
    
    const mentions = {};
    prng.forEach(p => {
        mentions[p.i] = p.id;
    });
    return mentions;
}

function parseAndCheckLogin(ctx, defaultFuncs) {
    return function(data) {
        if (typeof data === "string") {
            try {
                data = JSON.parse(data.replace(/^for \(;;\);/, ""));
            } catch (e) {
                return data;
            }
        }
        
        if (data.error === 1357001) {
            throw { error: "Not logged in" };
        }
        
        if (data.error === 1357004) {
            throw { error: "Session expired" };
        }
        
        return data;
    };
}

function log(tag, message) {
    console.log(`[ig-chat-api][${tag}] ${message}`);
}

function warn(tag, message) {
    console.warn(`[ig-chat-api][${tag}] WARNING: ${message}`);
}

function error(tag, message) {
    console.error(`[ig-chat-api][${tag}] ERROR: ${message}`);
}

function generateTimestampRelative() {
    const now = new Date();
    return now.getHours() + ":" + (now.getMinutes() < 10 ? "0" : "") + now.getMinutes();
}

function getSignatureID() {
    return Math.floor(Math.random() * 2147483648).toString(16);
}

function arrToForm(arr) {
    const form = {};
    arr.forEach(item => {
        if (item.name && item.val !== undefined) {
            form[item.name] = item.val;
        }
    });
    return form;
}

function getFrom(html, startToken, endToken) {
    const start = html.indexOf(startToken) + startToken.length;
    if (start < startToken.length) return "";
    
    const end = html.indexOf(endToken, start);
    if (end < 0) return html.substring(start);
    
    return html.substring(start, end);
}

function formatCookie(arr, url) {
    return `${arr[0]}=${arr[1]}; Path=/; Domain=.instagram.com`;
}

function getAppState(jar) {
    try {
        const cookies = jar.getCookiesSync("https://www.instagram.com");
        return cookies.map(cookie => ({
            key: cookie.key,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            hostOnly: cookie.hostOnly,
            creation: cookie.creation,
            lastAccessed: cookie.lastAccessed
        }));
    } catch (e) {
        return [];
    }
}

module.exports = {
    setProxy,
    getType,
    isReadableStream,
    formatCookiesForRequest,
    generateOfflineThreadingID,
    generateThreadingID,
    getGUID,
    formatID,
    get,
    post,
    postFormData,
    formatDeltaMessage,
    formatAttachments,
    formatMentions,
    parseAndCheckLogin,
    log,
    warn,
    error,
    generateTimestampRelative,
    getSignatureID,
    arrToForm,
    getFrom,
    formatCookie,
    getAppState,
    binaryToDecimal
};
