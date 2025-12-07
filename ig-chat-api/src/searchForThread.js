"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Search for Thread
 */

module.exports = function(ctx, api) {
    return function searchForThread(name, callback) {
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
        
        const headers = api.getHeaders();
        
        ctx.axios.get("/api/v1/direct_v2/ranked_recipients/?mode=raven&show_threads=true&query=" + encodeURIComponent(name), { headers })
        .then(response => {
            if (response.data && response.data.ranked_recipients) {
                const results = response.data.ranked_recipients.map(r => {
                    if (r.thread) {
                        return {
                            threadID: r.thread.thread_id,
                            threadName: r.thread.thread_title,
                            isGroup: r.thread.thread_type === "group"
                        };
                    }
                    if (r.user) {
                        return {
                            userID: r.user.pk,
                            username: r.user.username,
                            name: r.user.full_name
                        };
                    }
                    return null;
                }).filter(r => r !== null);
                
                callback(null, results);
            } else {
                callback(null, []);
            }
        })
        .catch(err => {
            callback(new Error(err.message));
        });
        
        return returnPromise;
    };
};
