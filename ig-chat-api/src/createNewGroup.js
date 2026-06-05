"use strict";

module.exports = function(ctx, api) {
    return function createNewGroup(participantIDs, groupTitle, callback) {
        let resolveFunc = () => {}, rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (typeof groupTitle === "function") { callback = groupTitle; groupTitle = null; }
        if (!callback) callback = (err, data) => err ? rejectFunc(err) : resolveFunc(data);
        if (!Array.isArray(participantIDs)) participantIDs = [participantIDs];

        const params = {
            recipient_users: JSON.stringify(participantIDs.map(id => [id.toString()])),
            client_context: `${Date.now()}`
        };
        if (groupTitle) params.thread_title = groupTitle;

        const body = new URLSearchParams(params).toString();

        ctx.axios.post(
            "/api/v1/direct_v2/create_group_thread/",
            body,
            { headers: { ...api.getHeaders(), "Content-Type": "application/x-www-form-urlencoded" } }
        )
        .then(res => {
            if (res.data?.thread_id) {
                callback(null, { threadID: res.data.thread_id, title: groupTitle });
            } else {
                callback(new Error("Failed to create group: no thread_id returned"));
            }
        })
        .catch(err => callback(new Error(err.message)));

        return returnPromise;
    };
};
