"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Change Group Image
 */

const fs = require("fs-extra");
const FormData = require("form-data");

module.exports = function(ctx, api) {
    return function changeGroupImage(image, threadID, callback) {
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
        
        console.log("[ig-chat-api] changeGroupImage: Limited support on Instagram");
        callback(null, { success: false, message: "Limited support" });
        
        return returnPromise;
    };
};
