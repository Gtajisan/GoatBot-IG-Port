"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Unfollow User
 */

module.exports = function(ctx, api) {
    return function unfriend(userID, callback) {
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
        
        ctx.axios.post("/api/v1/friendships/destroy/" + userID + "/", {}, { headers })
        .then(response => {
            if (response.data && response.data.status === "ok") {
                callback(null, { success: true, userID });
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
