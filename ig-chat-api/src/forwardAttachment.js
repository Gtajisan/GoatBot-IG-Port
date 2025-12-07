"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Forward Attachment
 */

module.exports = function(ctx, api) {
    return function forwardAttachment(messageID, threadID, callback) {
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
        
        ctx.axios.post("/api/v1/direct_v2/threads/broadcast/forward/", {
            thread_ids: JSON.stringify([threadID.toString()]),
            forwarded_from_message_id: messageID
        }, { headers })
        .then(response => {
            if (response.data && response.data.status === "ok") {
                callback(null, { success: true });
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
