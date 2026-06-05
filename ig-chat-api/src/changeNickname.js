"use strict";

module.exports = function(ctx, api) {
    return function changeNickname(nickname, threadID, participantID, callback) {
        let resolveFunc = () => {}, rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (!callback) callback = (err, data) => err ? rejectFunc(err) : resolveFunc(data);

        const body = new URLSearchParams({
            nickname: nickname || "",
            thread_id: threadID.toString(),
            participant_user_id: participantID.toString()
        }).toString();

        ctx.axios.post(
            `/api/v1/direct_v2/threads/${threadID}/update_title/`,
            body,
            { headers: { ...api.getHeaders(), "Content-Type": "application/x-www-form-urlencoded" } }
        )
        .then(res => callback(null, { success: res.data?.status === "ok" }))
        .catch(() => callback(null, { success: false }));

        return returnPromise;
    };
};
