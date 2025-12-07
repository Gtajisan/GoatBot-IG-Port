"use strict";

/**
 * Converts Instagram webhook events to FCA-compatible event format
 * This ensures GoatBot and other FCA-based bots work without modification
 */

function formatIGEventToFCA(igEvent, pageID) {
    const baseEvent = {
        type: "message",
        senderID: null,
        threadID: null,
        messageID: null,
        body: "",
        attachments: [],
        mentions: {},
        timestamp: Date.now(),
        isGroup: false,
        participantIDs: []
    };
    
    if (igEvent.message) {
        return formatMessageEvent(igEvent, pageID, baseEvent);
    }
    
    if (igEvent.postback) {
        return formatPostbackEvent(igEvent, pageID, baseEvent);
    }
    
    if (igEvent.reaction) {
        return formatReactionEvent(igEvent, pageID);
    }
    
    if (igEvent.read) {
        return formatReadEvent(igEvent, pageID);
    }
    
    if (igEvent.delivery) {
        return formatDeliveryEvent(igEvent, pageID);
    }
    
    return null;
}

function formatMessageEvent(igEvent, pageID, baseEvent) {
    const sender = igEvent.sender?.id;
    const recipient = igEvent.recipient?.id;
    const message = igEvent.message;
    
    if (sender === pageID) {
        return null;
    }
    
    const event = {
        ...baseEvent,
        type: "message",
        senderID: sender,
        threadID: sender,
        messageID: message.mid,
        body: message.text || "",
        timestamp: igEvent.timestamp || Date.now(),
        participantIDs: [sender, recipient]
    };
    
    if (message.attachments && message.attachments.length > 0) {
        event.attachments = message.attachments.map(att => formatAttachment(att));
    }
    
    if (message.reply_to) {
        event.messageReply = {
            messageID: message.reply_to.mid
        };
    }
    
    if (message.quick_reply) {
        event.quickReply = message.quick_reply;
    }
    
    if (message.is_echo) {
        event.type = "message_echo";
        event.isEcho = true;
    }
    
    return event;
}

function formatPostbackEvent(igEvent, pageID, baseEvent) {
    const sender = igEvent.sender?.id;
    const recipient = igEvent.recipient?.id;
    const postback = igEvent.postback;
    
    return {
        ...baseEvent,
        type: "message",
        senderID: sender,
        threadID: sender,
        messageID: `postback_${Date.now()}`,
        body: postback.payload || postback.title || "",
        timestamp: igEvent.timestamp || Date.now(),
        participantIDs: [sender, recipient],
        postback: {
            title: postback.title,
            payload: postback.payload
        }
    };
}

function formatReactionEvent(igEvent, pageID) {
    const sender = igEvent.sender?.id;
    const reaction = igEvent.reaction;
    
    return {
        type: "message_reaction",
        senderID: sender,
        threadID: sender,
        messageID: reaction.mid,
        reaction: reaction.emoji,
        userID: sender,
        reactionType: reaction.action,
        timestamp: igEvent.timestamp || Date.now()
    };
}

function formatReadEvent(igEvent, pageID) {
    const sender = igEvent.sender?.id;
    
    return {
        type: "read_receipt",
        senderID: sender,
        threadID: sender,
        watermark: igEvent.read?.watermark,
        timestamp: igEvent.timestamp || Date.now()
    };
}

function formatDeliveryEvent(igEvent, pageID) {
    const sender = igEvent.sender?.id;
    
    return {
        type: "delivery",
        senderID: sender,
        threadID: sender,
        messageIDs: igEvent.delivery?.mids || [],
        watermark: igEvent.delivery?.watermark,
        timestamp: igEvent.timestamp || Date.now()
    };
}

function formatAttachment(igAttachment) {
    const attachment = {
        type: igAttachment.type || "file",
        ID: igAttachment.payload?.sticker_id || `att_${Date.now()}`,
        url: igAttachment.payload?.url || "",
        filename: "",
        contentType: "",
        fileSize: 0
    };
    
    switch (igAttachment.type) {
        case "image":
            attachment.type = "photo";
            attachment.contentType = "image/jpeg";
            attachment.largePreviewUrl = igAttachment.payload?.url;
            attachment.previewUrl = igAttachment.payload?.url;
            attachment.thumbnailUrl = igAttachment.payload?.url;
            break;
            
        case "video":
            attachment.type = "video";
            attachment.contentType = "video/mp4";
            attachment.videoUrl = igAttachment.payload?.url;
            break;
            
        case "audio":
            attachment.type = "audio";
            attachment.contentType = "audio/mpeg";
            attachment.audioUrl = igAttachment.payload?.url;
            break;
            
        case "file":
            attachment.type = "file";
            attachment.fileUrl = igAttachment.payload?.url;
            break;
            
        case "sticker":
            attachment.type = "sticker";
            attachment.stickerID = igAttachment.payload?.sticker_id;
            attachment.url = igAttachment.payload?.url;
            break;
            
        case "share":
            attachment.type = "share";
            attachment.url = igAttachment.payload?.url;
            attachment.title = igAttachment.payload?.title;
            break;
            
        case "story_mention":
            attachment.type = "story_mention";
            attachment.url = igAttachment.payload?.url;
            break;
            
        default:
            attachment.type = igAttachment.type || "file";
    }
    
    return attachment;
}

function parseWebhookBody(body, pageID) {
    const events = [];
    
    if (body.object !== "instagram" && body.object !== "page") {
        return events;
    }
    
    for (const entry of (body.entry || [])) {
        const messaging = entry.messaging || [];
        const changes = entry.changes || [];
        
        for (const item of messaging) {
            const event = formatIGEventToFCA(item, pageID);
            if (event && event.senderID !== pageID) {
                events.push(event);
            }
        }
        
        for (const change of changes) {
            if (change.field === "messages" && change.value) {
                const value = change.value;
                
                if (value.messages) {
                    for (const msg of value.messages) {
                        const event = {
                            type: "message",
                            senderID: msg.from?.id || value.sender?.id,
                            threadID: msg.from?.id || value.sender?.id,
                            messageID: msg.id || msg.mid,
                            body: msg.text?.body || msg.text || "",
                            attachments: [],
                            timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
                            isGroup: false
                        };
                        
                        if (event.senderID !== pageID) {
                            events.push(event);
                        }
                    }
                }
            }
        }
    }
    
    return events;
}

module.exports = {
    formatIGEventToFCA,
    formatMessageEvent,
    formatPostbackEvent,
    formatReactionEvent,
    formatReadEvent,
    formatDeliveryEvent,
    formatAttachment,
    parseWebhookBody
};
