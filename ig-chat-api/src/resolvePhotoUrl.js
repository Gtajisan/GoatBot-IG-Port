"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Resolve Photo URL
 */

module.exports = function(ctx, api) {
    return function resolvePhotoUrl(photoID, callback) {
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
        
        ctx.axios.get("/api/v1/media/" + photoID + "/info/", { headers })
        .then(response => {
            if (response.data && response.data.items && response.data.items[0]) {
                const item = response.data.items[0];
                const url = item.image_versions2?.candidates?.[0]?.url || 
                           item.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url;
                callback(null, url);
            } else {
                callback(null, null);
            }
        })
        .catch(err => {
            callback(null, null);
        });
        
        return returnPromise;
    };
};
