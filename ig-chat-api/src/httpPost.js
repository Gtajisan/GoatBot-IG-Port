"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - HTTP Post
 */

module.exports = function(ctx, api) {
    return function httpPost(url, form, callback) {
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
        
        ctx.axios.post(url, form, { headers: api.getHeaders() })
        .then(response => {
            callback(null, response.data);
        })
        .catch(err => {
            callback(new Error(err.message));
        });
        
        return returnPromise;
    };
};
