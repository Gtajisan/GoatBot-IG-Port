"use strict";

const axios = require("axios");

/**
 * sendTypingIndicator - FCA-compatible typing indicator for Instagram
 * 
 * Usage (same as fb-chat-api):
 *   const end = api.sendTypingIndicator(threadID, callback);
 *   // ... do something
 *   end(); // stop typing
 */

module.exports = function(ctx) {
    
    return function sendTypingIndicator(threadID, callback) {
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
        
        let isTyping = true;
        
        const end = async () => {
            isTyping = false;
            try {
                const { accessToken, pageID, graphApiBase, apiVersion } = ctx;
                const url = `${graphApiBase}/${apiVersion}/${pageID}/messages`;
                await axios.post(url, {
                    recipient: { id: threadID.toString() },
                    sender_action: "typing_off"
                }, {
                    params: { access_token: accessToken },
                    timeout: 5000
                });
            } catch (e) {
            }
        };
        
        (async () => {
            try {
                const { accessToken, pageID, graphApiBase, apiVersion } = ctx;
                
                const url = `${graphApiBase}/${apiVersion}/${pageID}/messages`;
                await axios.post(url, {
                    recipient: { id: threadID.toString() },
                    sender_action: "typing_on"
                }, {
                    params: { access_token: accessToken },
                    timeout: 5000
                });
                
                callback(null, end);
                
            } catch (error) {
                callback(null, end);
            }
        })();
        
        return returnPromise;
    };
};
