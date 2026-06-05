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

const EMOJI_MAP = {
    ":love:"   : "❤️",
    ":heart:"  : "❤️",
    ":haha:"   : "😂",
    ":wow:"    : "😮",
    ":sad:"    : "😢",
    ":angry:"  : "😠",
    ":like:"   : "👍",
    ":dislike:": "👎",
    ":fire:"   : "🔥",
    ":100:"    : "💯",
    ":clap:"   : "👏"
};

module.exports = function(ctx) {
    return function setMessageReaction(reaction, messageID, threadID, callback) {
        if (typeof threadID === "function") { callback = threadID; threadID = null; }

        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (typeof callback !== "function") {
            callback = (err) => { if (err) return rejectFunc(err); resolveFunc(); };
        }

        if (!threadID) { callback(null); return returnPromise; }

        const emoji  = EMOJI_MAP[reaction] || reaction || "❤️";
        const status = (reaction && reaction !== "") ? "created" : "deleted";

        const payload = new URLSearchParams({
            reaction_type   : "like",
            reaction_status : status,
            emoji           : emoji,
            item_id         : messageID,
            node_type       : "item",
            reaction_with_fbid: "1",
            client_context  : Date.now().toString()
        }).toString();

        ctx.axios.post(
            `https://www.instagram.com/api/v1/direct_v2/threads/${threadID}/items/${messageID}/reactions/`,
            payload,
            { headers: { ...getHeaders(ctx), "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10000 }
        )
        .then(() => callback(null))
        .catch(() => callback(null));

        return returnPromise;
    };
};
