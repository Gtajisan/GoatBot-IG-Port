"use strict";

module.exports = function(ctx) {
    return function markAsRead(threadID, read, callback) {
        if (typeof read === "function") {
            callback = read;
            read = true;
        }
        
        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        
        if (typeof callback !== "function") {
            callback = (err) => {
                if (err) return rejectFunc(err);
                resolveFunc();
            };
        }
        
        ctx.axios.post(`/api/v1/direct_v2/threads/${threadID}/mark_visual_item_seen/`, 
            new URLSearchParams({
                use_unified_inbox: "true",
                action: "mark_seen"
            }).toString(),
            {
                headers: {
                    "User-Agent": ctx.globalOptions.userAgent,
                    "X-IG-App-ID": "936619743392459",
                    "X-CSRFToken": ctx.csrfToken,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        )
        .then(() => callback(null))
        .catch(error => callback(null));
        
        return returnPromise;
    };
};
