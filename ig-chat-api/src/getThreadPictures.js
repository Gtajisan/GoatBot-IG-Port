"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Get Thread Pictures
 */

module.exports = function(ctx, api) {
    return function getThreadPictures(threadID, offset, limit, callback) {
        let resolveFunc = () => {};
        let rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        
        if (typeof offset === "function") {
            callback = offset;
            offset = 0;
            limit = 20;
        }
        
        if (typeof limit === "function") {
            callback = limit;
            limit = 20;
        }
        
        if (!callback) {
            callback = (err, data) => {
                if (err) return rejectFunc(err);
                resolveFunc(data);
            };
        }
        
        api.getThreadHistory(threadID, limit, null, (err, messages) => {
            if (err) {
                return callback(err);
            }
            
            const pictures = [];
            messages.forEach(msg => {
                if (msg.attachments) {
                    msg.attachments.forEach(att => {
                        if (att.type === "photo" || att.type === "image") {
                            pictures.push({
                                ID: att.ID || att.id,
                                url: att.url,
                                width: att.width,
                                height: att.height,
                                timestamp: msg.timestamp
                            });
                        }
                    });
                }
            });
            
            callback(null, pictures);
        });
        
        return returnPromise;
    };
};
