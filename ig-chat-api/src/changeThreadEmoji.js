"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Change Thread Emoji
 */

module.exports = function(ctx, api) {
    return function changeThreadEmoji(emoji, threadID, callback) {
        let resolveFunc = () => {};
        let rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        
        if (!callback) {
            callback = (err, data) => {
                if (err) return rejectFunc(err);
                resolveFunc(data);
            };
        }
        
        console.log("[ig-chat-api] changeThreadEmoji: Limited support on Instagram");
        callback(null, { success: false, message: "Limited support" });
        
        return returnPromise;
    };
};
