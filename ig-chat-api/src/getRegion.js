"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Get Region
 */

module.exports = function(ctx, api) {
    return function getRegion() {
        return ctx.region || "IG";
    };
};
