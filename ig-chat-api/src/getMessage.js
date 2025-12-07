"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Get Message
 */

module.exports = function(ctx, api) {
    return function getMessage(threadID, messageID, callback) {
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
        
        api.getThreadHistory(threadID, 50, null, (err, messages) => {
            if (err) {
                return callback(err);
            }
            
            const message = messages.find(m => m.messageID === messageID);
            callback(null, message || null);
        });
        
        return returnPromise;
    };
};
