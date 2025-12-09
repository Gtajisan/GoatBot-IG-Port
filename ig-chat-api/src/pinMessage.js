"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Pin Message
 */

module.exports = function(ctx, api) {
    return function pinMessage(messageID, threadID, pin, callback) {
        let resolveFunc = () => {};
        let rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        
        if (typeof pin === "function") {
            callback = pin;
            pin = true;
        }
        
        if (!callback) {
            callback = (err, data) => {
                if (err) return rejectFunc(err);
                resolveFunc(data);
            };
        }
        
        console.log("[ig-chat-api] pinMessage: Not supported on Instagram DMs");
        callback(null, { success: false, message: "Not supported" });
        
        return returnPromise;
    };
};
