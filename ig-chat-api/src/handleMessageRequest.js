"use strict";

module.exports = function(ctx, api) {
    return function handleMessageRequest(threadID, accept, callback) {
        let resolveFunc = () => {}, rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (!callback) callback = (err, data) => err ? rejectFunc(err) : resolveFunc(data);

        const endpoint = accept ? "approve" : "decline";
        const body = new URLSearchParams({ thread_ids: JSON.stringify([threadID.toString()]) }).toString();

        ctx.axios.post(
            `/api/v1/direct_v2/pending-inbox/${endpoint}/`,
            body,
            { headers: { ...api.getHeaders(), "Content-Type": "application/x-www-form-urlencoded" } }
        )
        .then(res => callback(null, { success: res.data?.status === "ok", accepted: accept }))
        .catch(err => callback(null, { success: false, message: err.message }));

        return returnPromise;
    };
};
