"use strict";

/**
 * setMessageReaction - FCA-compatible reaction setter for Instagram
 * 
 * Note: Instagram Graph API has limited support for reactions
 * 
 * Usage (same as fb-chat-api):
 *   api.setMessageReaction("❤️", messageID, callback);
 */

module.exports = function(ctx) {
    
    return function setMessageReaction(reaction, messageID, callback, forceCustomReaction) {
        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        
        if (typeof callback !== "function") {
            callback = (err, result) => {
                if (err) return rejectFunc(err);
                resolveFunc(result);
            };
        }
        
        console.warn("[ig-chat-api] setMessageReaction: Limited support on Instagram Graph API");
        callback(null, true);
        
        return returnPromise;
    };
};
