"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Logout
 */

module.exports = function(ctx, api) {
    return function logout(callback) {
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
        
        ctx.loggedIn = false;
        
        if (ctx.mqttClient) {
            try {
                ctx.mqttClient.end();
            } catch (e) {}
            ctx.mqttClient = null;
        }
        
        if (ctx.stopListening) {
            ctx.stopListening();
        }
        
        callback(null, { success: true });
        
        return returnPromise;
    };
};
