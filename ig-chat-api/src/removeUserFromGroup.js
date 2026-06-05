"use strict";

module.exports = function(ctx, api) {
    return function removeUserFromGroup(userID, threadID, callback) {
        let resolveFunc = () => {}, rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (!callback) callback = (err, data) => err ? rejectFunc(err) : resolveFunc(data);

        const body = new URLSearchParams({
            user_ids: JSON.stringify([userID.toString()])
        }).toString();

        ctx.axios.post(
            `/api/v1/direct_v2/threads/${threadID}/remove_users/`,
            body,
            { headers: { ...api.getHeaders(), "Content-Type": "application/x-www-form-urlencoded" } }
        )
        .then(res => callback(null, { success: res.data?.status === "ok" }))
        .catch(err => {
            console.log("[ig-chat-api] removeUserFromGroup:", err.message);
            callback(null, { success: false });
        });

        return returnPromise;
    };
};
