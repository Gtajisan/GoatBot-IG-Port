"use strict";

module.exports = function(ctx) {
    return function unsendMessage(messageID, threadID, callback) {
        if (typeof threadID === "function") {
            callback = threadID;
            threadID = null;
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
        
        if (!threadID) {
            callback(new Error("threadID is required for unsendMessage on Instagram"));
            return returnPromise;
        }
        
        ctx.axios.post(`/api/v1/direct_v2/threads/${threadID}/items/${messageID}/delete/`,
            new URLSearchParams({}).toString(),
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
        .catch(error => callback(error));
        
        return returnPromise;
    };
};
