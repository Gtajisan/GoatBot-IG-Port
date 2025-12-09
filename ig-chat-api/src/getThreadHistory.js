"use strict";

module.exports = function(ctx) {
    return function getThreadHistory(threadID, amount, timestamp, callback) {
        if (typeof amount === "function") {
            callback = amount;
            amount = 20;
            timestamp = null;
        } else if (typeof timestamp === "function") {
            callback = timestamp;
            timestamp = null;
        }
        
        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        
        if (typeof callback !== "function") {
            callback = (err, info) => {
                if (err) return rejectFunc(err);
                resolveFunc(info);
            };
        }
        
        const params = {
            visual_message_return_type: "unseen",
            limit: amount || 20
        };
        
        if (timestamp) {
            params.cursor = timestamp;
        }
        
        ctx.axios.get(`/api/v1/direct_v2/threads/${threadID}/`, {
            params: params,
            headers: {
                "User-Agent": ctx.globalOptions.userAgent,
                "X-IG-App-ID": "936619743392459",
                "X-CSRFToken": ctx.csrfToken
            }
        })
        .then(response => {
            if (response.data && response.data.thread) {
                const items = response.data.thread.items || [];
                
                const messages = items.map(item => {
                    let body = "";
                    let attachments = [];
                    
                    switch (item.item_type) {
                        case "text":
                            body = item.text || "";
                            break;
                        case "media":
                        case "media_share":
                            if (item.media?.image_versions2?.candidates?.[0]?.url) {
                                attachments.push({
                                    type: "photo",
                                    url: item.media.image_versions2.candidates[0].url
                                });
                            }
                            break;
                        case "voice_media":
                            if (item.voice_media?.media?.audio?.audio_src) {
                                attachments.push({
                                    type: "audio",
                                    url: item.voice_media.media.audio.audio_src
                                });
                            }
                            break;
                        case "link":
                            body = item.link?.text || item.link?.link_context?.link_url || "";
                            break;
                        case "like":
                            body = item.like || "❤️";
                            break;
                    }
                    
                    return {
                        type: "message",
                        senderID: item.user_id?.toString(),
                        threadID: threadID,
                        messageID: item.item_id,
                        body: body,
                        attachments: attachments,
                        timestamp: item.timestamp,
                        isUnread: false
                    };
                });
                
                callback(null, messages);
            } else {
                callback(null, []);
            }
        })
        .catch(error => {
            callback(error);
        });
        
        return returnPromise;
    };
};
