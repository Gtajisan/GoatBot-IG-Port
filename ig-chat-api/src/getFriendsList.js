"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Get Friends/Followers List
 */

module.exports = function(ctx, api) {
    return function getFriendsList(callback) {
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
        
        ctx.axios.get("/api/v1/friendships/" + ctx.userID + "/following/?count=100", { headers })
        .then(response => {
            if (response.data && response.data.users) {
                const friends = response.data.users.map(user => ({
                    userID: user.pk.toString(),
                    username: user.username,
                    fullName: user.full_name,
                    profilePicture: user.profile_pic_url,
                    isPrivate: user.is_private,
                    isVerified: user.is_verified
                }));
                callback(null, friends);
            } else {
                callback(null, []);
            }
        })
        .catch(err => {
            callback(new Error(err.message));
        });
        
        return returnPromise;
    };
};
