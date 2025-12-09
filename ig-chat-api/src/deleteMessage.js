"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Delete Message (alias for unsendMessage)
 */

module.exports = function(ctx, api) {
    return function deleteMessage(messageID, threadID, callback) {
        return api.unsendMessage(messageID, threadID, callback);
    };
};
