"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Change Thread Color
 */

module.exports = function(ctx, api) {
    return function changeThreadColor(color, threadID, callback) {
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
        
        ctx.axios.post("/api/v1/direct_v2/threads/" + threadID + "/update_theme/", {
            theme_id: color
        }, { headers })
        .then(response => {
            callback(null, { success: true });
        })
        .catch(err => {
            callback(null, { success: false, message: err.message });
        });
        
        return returnPromise;
    };
};
