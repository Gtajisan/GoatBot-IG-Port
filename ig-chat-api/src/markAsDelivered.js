"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Mark as Delivered
 */

module.exports = function(ctx, api) {
    return function markAsDelivered(threadID, messageID, callback) {
        return api.markAsRead(threadID, callback);
    };
};
