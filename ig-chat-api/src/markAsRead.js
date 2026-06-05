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

module.exports = function(ctx) {
    return function markAsRead(threadID, read, callback) {
        if (typeof read === "function") { callback = read; read = true; }

        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (typeof callback !== "function") {
            callback = (err) => { if (err) return rejectFunc(err); resolveFunc(); };
        }

        const payload = new URLSearchParams({ use_unified_inbox: "true" }).toString();
        ctx.axios.post(
            `https://www.instagram.com/api/v1/direct_v2/threads/${threadID}/mark_visual_item_seen/`,
            payload,
            { headers: { ...getHeaders(ctx), "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10000 }
        )
        .then(() => callback(null))
        .catch(() => callback(null));

        return returnPromise;
    };
};
