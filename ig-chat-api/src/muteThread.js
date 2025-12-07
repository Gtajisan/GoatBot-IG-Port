"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Mute Thread
 */

module.exports = function(ctx, api) {
    return function muteThread(threadID, muteSeconds, callback) {
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
        
        const headers = api.getHeaders();
        
        ctx.axios.post("/api/v1/direct_v2/threads/" + threadID + "/mute/", {
            mute_until: muteSeconds === -1 ? -1 : Math.floor(Date.now() / 1000) + muteSeconds
        }, { headers })
        .then(response => {
            callback(null, { success: true });
        })
        .catch(err => {
            callback(null, { success: false, message: err.message });
        });
        
        return returnPromise;
    };
};
