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
    return function sendTypingIndicator(threadID, isTyping, callback) {
        if (typeof isTyping === "function") { callback = isTyping; isTyping = true; }

        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (typeof callback !== "function") {
            callback = (err, end) => { if (err) return rejectFunc(err); resolveFunc(end); };
        }

        const post = (status) => ctx.axios.post(
            `https://www.instagram.com/api/v1/direct_v2/threads/${threadID}/activity/`,
            new URLSearchParams({ activity_status: status ? "1" : "0" }).toString(),
            { headers: { ...getHeaders(ctx), "Content-Type": "application/x-www-form-urlencoded" }, timeout: 8000 }
        ).catch(() => {});

        post(isTyping !== false).then(() => {
            const end = () => post(false);
            callback(null, end);
        }).catch(() => callback(null, () => {}));

        return returnPromise;
    };
};
