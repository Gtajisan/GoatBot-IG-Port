"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Create New Group
 */

module.exports = function(ctx, api) {
    return function createNewGroup(participantIDs, groupTitle, callback) {
        let resolveFunc = () => {};
        let rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        
        if (!callback && typeof groupTitle === "function") {
            callback = groupTitle;
            groupTitle = null;
        }
        
        if (!callback) {
            callback = (err, data) => {
                if (err) return rejectFunc(err);
                resolveFunc(data);
            };
        }
        
        if (!Array.isArray(participantIDs)) {
            participantIDs = [participantIDs];
        }
        
        const headers = api.getHeaders();
        
        const formData = {
            recipient_users: JSON.stringify(participantIDs.map(id => id.toString())),
            client_context: Date.now().toString()
        };
        
        if (groupTitle) {
            formData.thread_title = groupTitle;
        }
        
        ctx.axios.post("/api/v1/direct_v2/create_group_thread/", formData, { headers })
        .then(response => {
            if (response.data && response.data.thread_id) {
                callback(null, {
                    threadID: response.data.thread_id,
                    title: groupTitle
                });
            } else {
                callback(new Error("Failed to create group"));
            }
        })
        .catch(err => {
            callback(new Error(err.message));
        });
        
        return returnPromise;
    };
};
