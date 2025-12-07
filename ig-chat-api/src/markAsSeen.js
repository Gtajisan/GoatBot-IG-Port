"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Mark as Seen
 */

module.exports = function(ctx, api) {
    return function markAsSeen(seenTimestamp, callback) {
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
        
        callback(null, { success: true });
        
        return returnPromise;
    };
};
