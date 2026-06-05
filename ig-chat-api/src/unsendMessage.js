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
    return function unsendMessage(messageID, threadID, callback) {
        if (typeof threadID === "function") { callback = threadID; threadID = null; }

        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (typeof callback !== "function") {
            callback = (err) => { if (err) return rejectFunc(err); resolveFunc(); };
        }

        if (!threadID) {
            callback(new Error("threadID is required for unsendMessage"));
            return returnPromise;
        }

        const payload = new URLSearchParams({
            _uuid      : ctx.clientID || Date.now().toString(),
            _csrftoken : ctx.csrfToken || ""
        }).toString();

        ctx.axios.post(
            `https://www.instagram.com/api/v1/direct_v2/threads/${threadID}/items/${messageID}/delete/`,
            payload,
            { headers: { ...getHeaders(ctx), "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10000 }
        )
        .then(() => callback(null))
        .catch(err => callback(err));

        return returnPromise;
    };
};
