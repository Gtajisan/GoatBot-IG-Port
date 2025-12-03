"use strict";

const axios = require("axios");

/**
 * markAsRead - FCA-compatible read receipt for Instagram
 * 
 * Usage (same as fb-chat-api):
 *   api.markAsRead(threadID, callback);
 */

module.exports = function(ctx) {
    
    return function markAsRead(threadID, callback) {
        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        
        if (typeof callback !== "function") {
            callback = (err, result) => {
                if (err) return rejectFunc(err);
                resolveFunc(result);
            };
        }
        
        (async () => {
            try {
                const { accessToken, pageID, graphApiBase, apiVersion } = ctx;
                
                const url = `${graphApiBase}/${apiVersion}/${pageID}/messages`;
                await axios.post(url, {
                    recipient: { id: threadID.toString() },
                    sender_action: "mark_seen"
                }, {
                    params: { access_token: accessToken },
                    timeout: 10000
                });
                
                callback(null, true);
                
            } catch (error) {
                callback(null, false);
            }
        })();
        
        return returnPromise;
    };
};
