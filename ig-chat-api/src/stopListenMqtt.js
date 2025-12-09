"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Stop Listen MQTT
 */

module.exports = function(ctx, api) {
    return function stopListenMqtt(callback) {
        if (ctx.mqttClient) {
            try {
                ctx.mqttClient.end();
            } catch (e) {}
            ctx.mqttClient = null;
        }
        
        if (ctx.stopListening) {
            ctx.stopListening();
        }
        
        if (callback) callback();
        return Promise.resolve();
    };
};
