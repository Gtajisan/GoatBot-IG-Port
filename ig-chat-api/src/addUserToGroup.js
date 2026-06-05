"use strict";

module.exports = function(ctx, api) {
    return function addUserToGroup(userID, threadID, callback) {
        let resolveFunc = () => {}, rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (!callback) callback = (err, data) => err ? rejectFunc(err) : resolveFunc(data);

        if (!Array.isArray(userID)) userID = [userID];

        const body = new URLSearchParams({
            user_ids: JSON.stringify(userID.map(id => id.toString()))
        }).toString();

        ctx.axios.post(
            `/api/v1/direct_v2/threads/${threadID}/add_user/`,
            body,
            { headers: { ...api.getHeaders(), "Content-Type": "application/x-www-form-urlencoded" } }
        )
        .then(res => callback(null, { success: res.data?.status === "ok", threadID }))
        .catch(err => {
            console.log("[ig-chat-api] addUserToGroup:", err.message);
            callback(null, { success: false, error: err.message });
        });

        return returnPromise;
    };
};
