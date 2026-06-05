"use strict";

const IG_APP_ID = "936619743392459";

function getHeaders(ctx) {
    return {
        "User-Agent"       : ctx.globalOptions.userAgent,
        "Accept"           : "*/*",
        "Accept-Language"  : "en-US,en;q=0.9",
        "X-IG-App-ID"      : IG_APP_ID,
        "X-ASBD-ID"        : "129477",
        "X-IG-WWW-Claim"   : ctx.wwwClaim || "0",
        "X-Requested-With" : "XMLHttpRequest",
        "X-CSRFToken"      : ctx.csrfToken || "",
        "Origin"           : "https://www.instagram.com",
        "Referer"          : "https://www.instagram.com/",
        "Sec-Fetch-Dest"   : "empty",
        "Sec-Fetch-Mode"   : "cors",
        "Sec-Fetch-Site"   : "same-origin"
    };
}

function formatUser(user, id) {
    const pk = (user.pk || user.id || id || "").toString();
    return {
        id             : pk,
        name           : user.full_name || user.username || `User ${pk}`,
        firstName      : (user.full_name || user.username || "User").split(" ")[0],
        vanity         : user.username || "",
        username       : user.username || "",
        thumbSrc       : user.profile_pic_url || "",
        profileUrl     : user.username ? `https://www.instagram.com/${user.username}/` : "",
        gender         : null,
        type           : user.is_business ? "business" : "user",
        isFriend       : user.friendship_status?.following || false,
        isBirthday     : false,
        isVerified     : user.is_verified || false,
        followerCount  : user.follower_count  || 0,
        followingCount : user.following_count || 0
    };
}

module.exports = function(ctx) {
    return function getUserInfo(userIDs, callback) {
        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc  = reject;
        });

        if (typeof callback !== "function") {
            callback = (err, info) => { if (err) return rejectFunc(err); resolveFunc(info); };
        }

        const ids = (Array.isArray(userIDs) ? userIDs : [userIDs]).map(String);
        const result = {};

        Promise.allSettled(
            ids.map(id =>
                ctx.axios.get(`https://www.instagram.com/api/v1/users/${id}/info/`, {
                    headers: getHeaders(ctx),
                    timeout: 15000
                }).then(res => {
                    if (res.data?.user) result[id] = formatUser(res.data.user, id);
                    else result[id] = formatUser({ pk: id }, id);
                }).catch(() => {
                    result[id] = formatUser({ pk: id }, id);
                })
            )
        ).then(() => callback(null, result));

        return returnPromise;
    };
};
