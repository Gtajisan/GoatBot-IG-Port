"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Get User ID from username
 */

module.exports = function(ctx, api) {
    return function getUserID(username, callback) {
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
        
        if (!Array.isArray(username)) {
            username = [username];
        }
        
        const headers = api.getHeaders();
        
        const promises = username.map(name => {
            const cleanName = name.replace("@", "").trim();
            return ctx.axios.get("/api/v1/users/web_profile_info/?username=" + encodeURIComponent(cleanName), { headers })
            .then(response => {
                if (response.data && response.data.data && response.data.data.user) {
                    const user = response.data.data.user;
                    return {
                        userID: user.id,
                        username: user.username,
                        name: user.full_name
                    };
                }
                return null;
            })
            .catch(() => null);
        });
        
        Promise.all(promises)
        .then(results => {
            const users = results.filter(r => r !== null);
            callback(null, users);
        })
        .catch(err => {
            callback(new Error(err.message));
        });
        
        return returnPromise;
    };
};
