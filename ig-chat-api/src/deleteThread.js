"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Delete Thread
 */

module.exports = function(ctx, api) {
    return function deleteThread(threadID, callback) {
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
        
        if (!Array.isArray(threadID)) {
            threadID = [threadID];
        }
        
        const headers = api.getHeaders();
        
        const promises = threadID.map(tid => 
            ctx.axios.post("/api/v1/direct_v2/threads/" + tid + "/hide/", {}, { headers })
        );
        
        Promise.all(promises)
        .then(responses => {
            callback(null, { success: true, deletedThreads: threadID });
        })
        .catch(err => {
            callback(null, { success: false, message: err.message });
        });
        
        return returnPromise;
    };
};
