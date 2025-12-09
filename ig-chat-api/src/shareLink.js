"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Share Link
 */

module.exports = function(ctx, api) {
    return function shareLink(text, url, threadID, callback) {
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
        
        const message = text ? `${text}\n${url}` : url;
        api.sendMessage(message, threadID, callback);
        
        return returnPromise;
    };
};
