"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Remove User from Group
 */

module.exports = function(ctx, api) {
    return function removeUserFromGroup(userID, threadID, callback) {
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
        
        ctx.axios.post("/api/v1/direct_v2/threads/" + threadID + "/remove_users/", {
            user_ids: JSON.stringify([userID.toString()])
        }, { headers })
        .then(response => {
            if (response.data && response.data.status === "ok") {
                callback(null, { success: true });
            } else {
                callback(null, { success: false });
            }
        })
        .catch(err => {
            console.log("[ig-chat-api] removeUserFromGroup: " + err.message);
            callback(null, { success: false });
        });
        
        return returnPromise;
    };
};
