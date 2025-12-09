"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Add User to Group
 */

module.exports = function(ctx, api) {
    return function addUserToGroup(userID, threadID, callback) {
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
        
        if (!Array.isArray(userID)) {
            userID = [userID];
        }
        
        const headers = api.getHeaders();
        
        ctx.axios.post("/api/v1/direct_v2/threads/" + threadID + "/add_user/", {
            user_ids: JSON.stringify(userID.map(id => id.toString()))
        }, { headers })
        .then(response => {
            if (response.data && response.data.status === "ok") {
                callback(null, { success: true, threadID });
            } else {
                callback(null, { success: false, error: "Failed to add user" });
            }
        })
        .catch(err => {
            console.log("[ig-chat-api] addUserToGroup not fully supported on Instagram");
            callback(null, { success: false, error: err.message });
        });
        
        return returnPromise;
    };
};
