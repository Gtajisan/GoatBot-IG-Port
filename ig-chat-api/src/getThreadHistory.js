"use strict";

const IG_APP_ID = "936619743392459";

function getHeaders(ctx) {
    return {
        "User-Agent"       : ctx.globalOptions.userAgent,
        "Accept"           : "*/*",
        "Accept-Language"  : "en-US,en;q=0.9",
        "X-IG-App-ID"      : IG_APP_ID,
        "X-ASBD-ID"        : "129477",
        "X-IG-WWW-Claim"   : ctx.wwwClaim || "0",
        "X-Requested-With" : "XMLHttpRequest",
        "X-CSRFToken"      : ctx.csrfToken || "",
        "Origin"           : "https://www.instagram.com",
        "Referer"          : "https://www.instagram.com/direct/inbox/",
        "Sec-Fetch-Dest"   : "empty",
        "Sec-Fetch-Mode"   : "cors",
        "Sec-Fetch-Site"   : "same-origin"
    };
}

function itemToMessage(item, threadID) {
    let body = "", attachments = [];
    switch (item.item_type) {
        case "text"        : body = item.text || ""; break;
        case "media"       :
        case "media_share" : {
            const url = item.media?.image_versions2?.candidates?.[0]?.url || null;
            if (url) attachments.push({ type: "photo", url, ID: item.item_id });
            if (item.media?.caption?.text) body = item.media.caption.text;
            break;
        }
        case "voice_media" : {
            const src = item.voice_media?.media?.audio?.audio_src;
            if (src) attachments.push({ type: "audio", url: src, ID: item.item_id });
            break;
        }
        case "link"        : body = item.link?.text || item.link?.link_context?.link_url || ""; break;
        case "like"        : body = item.like || "❤️"; break;
        case "reel_share"  : body = item.reel_share?.text || "[Reel]"; break;
        default            : body = item.text || "";
    }
    return {
        type        : "message",
        senderID    : (item.user_id || "").toString(),
        threadID    : threadID.toString(),
        messageID   : item.item_id,
        body,
        attachments,
        timestamp   : item.timestamp || Date.now(),
        isUnread    : false
    };
}

module.exports = function(ctx) {
    return function getThreadHistory(threadID, amount, timestamp, callback) {
        if (typeof amount    === "function") { callback = amount;    amount = 20;   timestamp = null; }
        else if (typeof timestamp === "function") { callback = timestamp; timestamp = null; }

        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (typeof callback !== "function") {
            callback = (err, info) => { if (err) return rejectFunc(err); resolveFunc(info); };
        }

        const params = { visual_message_return_type: "unseen", limit: amount || 20 };
        if (timestamp) params.cursor = timestamp;

        ctx.axios.get(`https://www.instagram.com/api/v1/direct_v2/threads/${threadID}/`, {
            params, headers: getHeaders(ctx), timeout: 15000
        })
        .then(res => {
            const items = (res.data?.thread?.items || []).map(i => itemToMessage(i, threadID));
            callback(null, items);
        })
        .catch(err => callback(err));

        return returnPromise;
    };
};
