'use strict';

// Placeholder for Audio (Instagram usually handles this as video or voice_media)
// For compatibility with GoatBot V2 commands
module.exports = function(threadID, url, callback) {
    return this.sendVideoFromUrl(threadID, url, callback);
};
