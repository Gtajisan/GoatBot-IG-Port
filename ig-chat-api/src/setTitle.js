"use strict";

module.exports = function(ctx, api) {
    return function setTitle(newTitle, threadID, callback) {
        let resolveFunc = () => {}, rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (!callback) callback = (err, data) => err ? rejectFunc(err) : resolveFunc(data);

        const body = new URLSearchParams({ title: newTitle }).toString();

        ctx.axios.post(
            `/api/v1/direct_v2/threads/${threadID}/update_title/`,
            body,
            { headers: { ...api.getHeaders(), "Content-Type": "application/x-www-form-urlencoded" } }
        )
        .then(res => callback(null, { success: res.data?.status === "ok", threadID, title: newTitle }))
        .catch(err => callback(null, { success: false, message: err.message }));

        return returnPromise;
    };
};
