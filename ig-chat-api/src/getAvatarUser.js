"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Get Avatar/Profile Picture
 */

module.exports = function(ctx, api) {
    return function getAvatarUser(userID, callback) {
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
        
        const promises = userID.map(uid => 
            ctx.axios.get("/api/v1/users/" + uid + "/info/", { headers })
            .then(response => {
                if (response.data && response.data.user) {
                    return {
                        userID: uid,
                        url: response.data.user.profile_pic_url,
                        urlHD: response.data.user.hd_profile_pic_url_info?.url || response.data.user.profile_pic_url
                    };
                }
                return null;
            })
            .catch(() => null)
        );
        
        Promise.all(promises)
        .then(results => {
            const avatars = {};
            results.filter(r => r !== null).forEach(r => {
                avatars[r.userID] = r;
            });
            callback(null, avatars);
        })
        .catch(err => {
            callback(new Error(err.message));
        });
        
        return returnPromise;
    };
};
