"use strict";

module.exports = function(ctx) {
    return function sendTypingIndicator(threadID, isTyping, callback) {
        if (typeof isTyping === "function") {
            callback = isTyping;
            isTyping = true;
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
        
        ctx.axios.post(`/api/v1/direct_v2/threads/${threadID}/activity/`,
            new URLSearchParams({
                activity_status: isTyping ? "1" : "0"
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
        .then(() => {
            const end = () => {
                ctx.axios.post(`/api/v1/direct_v2/threads/${threadID}/activity/`,
                    new URLSearchParams({ activity_status: "0" }).toString(),
                    {
                        headers: {
                            "User-Agent": ctx.globalOptions.userAgent,
                            "X-IG-App-ID": "936619743392459",
                            "X-CSRFToken": ctx.csrfToken,
                            "Content-Type": "application/x-www-form-urlencoded"
                        }
                    }
                ).catch(() => {});
            };
            callback(null, end);
        })
        .catch(error => callback(null, () => {}));
        
        return returnPromise;
    };
};
