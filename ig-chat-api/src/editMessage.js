"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Edit Message
 */

module.exports = function(ctx, api) {
    return function editMessage(text, messageID, callback) {
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
        
        console.log("[ig-chat-api] editMessage: Not supported on Instagram");
        callback(null, { success: false, message: "Instagram does not support editing messages" });
        
        return returnPromise;
    };
};
