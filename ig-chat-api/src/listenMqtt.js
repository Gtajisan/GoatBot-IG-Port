"use strict";

const mqtt = require("mqtt");
const EventEmitter = require("events");

module.exports = function(ctx, api) {
    return function listenMqtt(callback) {
        const emitter = new EventEmitter();
        let pollingInterval = null;
        let lastCursor = null;
        let isListening = true;
        
        console.log("[ig-chat-api] Starting message listener...");
        
        const pollForMessages = async () => {
            if (!isListening) return;
            
            try {
                const response = await ctx.axios.get("/api/v1/direct_v2/inbox/", {
                    params: {
                        visual_message_return_type: "unseen",
                        persistentBadging: true,
                        limit: 20
                    },
                    headers: api.getHeaders()
                });
                
                if (response.data && response.data.inbox) {
                    const threads = response.data.inbox.threads || [];
                    
                    for (const thread of threads) {
                        const items = thread.items || [];
                        
                        for (const item of items) {
                            if (!lastCursor || item.timestamp > lastCursor) {
                                if (item.user_id?.toString() !== ctx.userID) {
                                    const event = formatEvent(thread, item);
                                    
                                    if (callback) {
                                        callback(null, event);
                                    }
                                    emitter.emit("message", event);
                                    api.emit("message", event);
                                }
                            }
                        }
                    }
                    
                    if (threads.length > 0 && threads[0].items?.length > 0) {
                        lastCursor = threads[0].items[0].timestamp;
                    }
                }
            } catch (error) {
                if (error.response?.status === 429) {
                    console.log("[ig-chat-api] Rate limited, waiting 60 seconds...");
                    await new Promise(resolve => setTimeout(resolve, 60000));
                } else if (error.response?.status === 401 || error.response?.status === 403) {
                    console.error("[ig-chat-api] Session expired or invalid");
                    if (callback) callback(error);
                    emitter.emit("error", error);
                }
            }
        };
        
        const formatEvent = (thread, item) => {
            const threadID = thread.thread_id;
            const senderID = item.user_id?.toString();
            const messageID = item.item_id;
            
            let body = "";
            let attachments = [];
            let type = "message";
            
            switch (item.item_type) {
                case "text":
                    body = item.text || "";
                    break;
                case "media":
                case "media_share":
                    type = "message";
                    if (item.media?.image_versions2?.candidates?.[0]?.url) {
                        attachments.push({
                            type: "photo",
                            url: item.media.image_versions2.candidates[0].url
                        });
                    }
                    break;
                case "voice_media":
                    type = "message";
                    if (item.voice_media?.media?.audio?.audio_src) {
                        attachments.push({
                            type: "audio",
                            url: item.voice_media.media.audio.audio_src
                        });
                    }
                    break;
                case "raven_media":
                    type = "message";
                    break;
                case "story_share":
                    type = "message";
                    body = item.story_share?.text || "[Story Share]";
                    break;
                case "link":
                    type = "message";
                    body = item.link?.text || item.link?.link_context?.link_url || "";
                    break;
                case "like":
                    type = "message";
                    body = item.like || "❤️";
                    break;
                case "reel_share":
                    type = "message";
                    body = item.reel_share?.text || "[Reel Share]";
                    break;
                case "action_log":
                    type = "event";
                    body = item.action_log?.description || "";
                    break;
                default:
                    body = "";
            }
            
            const participantIDs = (thread.users || []).map(u => u.pk?.toString());
            participantIDs.push(ctx.userID);
            
            return {
                type: type,
                senderID: senderID,
                threadID: threadID,
                messageID: messageID,
                body: body,
                attachments: attachments,
                timestamp: item.timestamp,
                isGroup: thread.thread_type === "group" || (thread.users?.length > 1),
                participantIDs: participantIDs,
                threadName: thread.thread_title || null,
                mentions: {},
                isUnread: true
            };
        };
        
        pollForMessages();
        pollingInterval = setInterval(pollForMessages, 3000);
        
        ctx.stopListening = () => {
            isListening = false;
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
            console.log("[ig-chat-api] Stopped listening");
        };
        
        const stopListening = ctx.stopListening;
        
        console.log("[ig-chat-api] ✓ Message listener started (polling mode)");
        
        return stopListening;
    };
};
