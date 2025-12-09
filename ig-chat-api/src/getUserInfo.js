"use strict";

module.exports = function(ctx) {
    return function getUserInfo(userIDs, callback) {
        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        
        if (typeof callback !== "function") {
            callback = (err, info) => {
                if (err) return rejectFunc(err);
                resolveFunc(info);
            };
        }
        
        const ids = Array.isArray(userIDs) ? userIDs : [userIDs];
        const userInfo = {};
        
        const fetchUserInfo = async () => {
            try {
                for (const id of ids) {
                    try {
                        const response = await ctx.axios.get(`/api/v1/users/${id}/info/`, {
                            headers: {
                                "User-Agent": ctx.globalOptions.userAgent,
                                "X-IG-App-ID": "936619743392459",
                                "X-CSRFToken": ctx.csrfToken
                            }
                        });
                        
                        if (response.data && response.data.user) {
                            const user = response.data.user;
                            userInfo[id] = {
                                id: user.pk?.toString() || id,
                                name: user.full_name || user.username,
                                firstName: user.full_name?.split(" ")[0] || user.username,
                                vanity: user.username,
                                username: user.username,
                                thumbSrc: user.profile_pic_url,
                                profileUrl: `https://instagram.com/${user.username}`,
                                gender: null,
                                type: user.is_business ? "business" : "user",
                                isFriend: user.friendship_status?.following || false,
                                isBirthday: false,
                                isVerified: user.is_verified || false,
                                followerCount: user.follower_count,
                                followingCount: user.following_count
                            };
                        }
                    } catch (e) {
                        userInfo[id] = {
                            id: id,
                            name: `User ${id}`,
                            firstName: "User",
                            vanity: "",
                            username: "",
                            thumbSrc: "",
                            profileUrl: "",
                            gender: null,
                            type: "user",
                            isFriend: false,
                            isBirthday: false
                        };
                    }
                }
                
                callback(null, userInfo);
            } catch (error) {
                callback(error);
            }
        };
        
        fetchUserInfo();
        
        return returnPromise;
    };
};
