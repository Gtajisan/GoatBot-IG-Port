"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Change Admin Status
 */

module.exports = function(ctx, api) {
    return function changeAdminStatus(threadID, adminIDs, adminStatus, callback) {
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
        
        console.log("[ig-chat-api] changeAdminStatus: Instagram does not support group admin roles like Facebook");
        callback(null, { success: false, message: "Not supported on Instagram" });
        
        return returnPromise;
    };
};
