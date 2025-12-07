"use strict";

module.exports = function(ctx) {
    return function setMessageReaction(reaction, messageID, threadID, callback) {
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
            callback(null);
            return returnPromise;
        }
        
        const emojiMap = {
            ":love:": "❤️",
            ":haha:": "😂",
            ":wow:": "😮",
            ":sad:": "😢",
            ":angry:": "😠",
            ":like:": "👍",
            ":dislike:": "👎",
            ":fire:": "🔥"
        };
        
        const emoji = emojiMap[reaction] || reaction || "❤️";
        
        ctx.axios.post(`/api/v1/direct_v2/threads/${threadID}/items/${messageID}/reactions/`,
            new URLSearchParams({
                reaction_type: "like",
                reaction_status: reaction ? "created" : "deleted",
                emoji: emoji
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
