"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Change Nickname
 */

module.exports = function(ctx, api) {
    return function changeNickname(nickname, threadID, participantID, callback) {
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
        
        console.log("[ig-chat-api] changeNickname: Instagram DMs do not support nicknames");
        callback(null, { success: false, message: "Not supported on Instagram" });
        
        return returnPromise;
    };
};
