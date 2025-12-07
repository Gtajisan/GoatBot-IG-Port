"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Get Options
 */

module.exports = function(ctx, api) {
    return function getOptions() {
        return { ...ctx.globalOptions };
    };
};
