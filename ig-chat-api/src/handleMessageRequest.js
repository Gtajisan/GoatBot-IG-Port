"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Handle Message Request
 */

module.exports = function(ctx, api) {
    return function handleMessageRequest(threadID, accept, callback) {
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
        const endpoint = accept ? "approve" : "decline";
        
        ctx.axios.post("/api/v1/direct_v2/threads/" + threadID + "/" + endpoint + "/", {}, { headers })
        .then(response => {
            if (response.data && response.data.status === "ok") {
                callback(null, { success: true, accepted: accept });
            } else {
                callback(null, { success: false });
            }
        })
        .catch(err => {
            callback(null, { success: false, message: err.message });
        });
        
        return returnPromise;
    };
};
