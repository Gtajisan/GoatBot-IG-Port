"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Block/Unblock User
 */

module.exports = function(ctx, api) {
    return function changeBlockedStatus(userID, block, callback) {
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
        const endpoint = block ? "block" : "unblock";
        
        ctx.axios.post("/api/v1/friendships/" + endpoint + "/" + userID + "/", {}, { headers })
        .then(response => {
            if (response.data && response.data.status === "ok") {
                callback(null, { success: true, blocked: block });
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
