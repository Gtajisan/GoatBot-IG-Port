"use strict";

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

/**
 * sendMessage - FCA-compatible message sending for Instagram
 * 
 * Usage (same as fb-chat-api):
 *   api.sendMessage("Hello", threadID, callback);
 *   api.sendMessage({ body: "Hello" }, threadID);
 *   api.sendMessage({ body: "Check this", attachment: fs.createReadStream("image.jpg") }, threadID);
 */

module.exports = function(ctx) {
    
    async function uploadAttachment(attachment) {
        const { accessToken, pageID, graphApiBase, apiVersion } = ctx;
        
        let fileStream;
        let attachmentType = "image";
        
        if (typeof attachment === "string") {
            if (attachment.startsWith("http://") || attachment.startsWith("https://")) {
                return {
                    type: "image",
                    payload: { url: attachment, is_reusable: true }
                };
            }
            
            if (fs.existsSync(attachment)) {
                fileStream = fs.createReadStream(attachment);
                const ext = path.extname(attachment).toLowerCase();
                if ([".mp4", ".mov", ".avi"].includes(ext)) {
                    attachmentType = "video";
                } else if ([".mp3", ".wav", ".ogg", ".m4a"].includes(ext)) {
                    attachmentType = "audio";
                } else if (![".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
                    attachmentType = "file";
                }
            } else {
                throw new Error(`File not found: ${attachment}`);
            }
        } else if (attachment && typeof attachment.pipe === "function") {
            fileStream = attachment;
        } else if (attachment && attachment.url) {
            return {
                type: attachment.type || "image",
                payload: { url: attachment.url, is_reusable: true }
            };
        }
        
        if (!fileStream) {
            throw new Error("Invalid attachment format");
        }
        
        const form = new FormData();
        form.append("message", JSON.stringify({
            attachment: {
                type: attachmentType,
                payload: { is_reusable: true }
            }
        }));
        form.append("filedata", fileStream);
        
        try {
            const url = `${graphApiBase}/${apiVersion}/${pageID}/message_attachments`;
            const response = await axios.post(url, form, {
                params: { access_token: accessToken },
                headers: form.getHeaders(),
                timeout: 120000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return {
                type: attachmentType,
                payload: { attachment_id: response.data.attachment_id }
            };
        } catch (error) {
            console.error("[ig-chat-api] Attachment upload failed:", error.response?.data?.error?.message || error.message);
            throw error;
        }
    }
    
    return function sendMessage(msg, threadID, callback, replyToMessage, isGroup) {
        if (typeof threadID === "function") {
            return threadID({ error: "ThreadID is required as second argument" });
        }
        
        if (typeof callback === "string") {
            replyToMessage = callback;
            callback = null;
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
        
        (async () => {
            try {
                const { accessToken, pageID, graphApiBase, apiVersion } = ctx;
                
                let messageData = {};
                
                if (typeof msg === "string") {
                    messageData.text = msg;
                } else if (msg && typeof msg === "object") {
                    if (msg.body) {
                        messageData.text = msg.body;
                    }
                    if (msg.text) {
                        messageData.text = msg.text;
                    }
                    
                    if (msg.attachment) {
                        const attachments = Array.isArray(msg.attachment) ? msg.attachment : [msg.attachment];
                        
                        for (const att of attachments) {
                            try {
                                const uploaded = await uploadAttachment(att);
                                messageData.attachment = uploaded;
                            } catch (e) {
                                console.error("[ig-chat-api] Failed to upload attachment:", e.message);
                            }
                        }
                    }
                    
                    if (msg.url && !messageData.attachment) {
                        messageData.attachment = {
                            type: "template",
                            payload: {
                                template_type: "generic",
                                elements: [{
                                    title: msg.body || msg.text || "Link",
                                    default_action: {
                                        type: "web_url",
                                        url: msg.url
                                    }
                                }]
                            }
                        };
                    }
                    
                    if (msg.sticker) {
                        if (!messageData.text) {
                            messageData.text = `[Sticker]`;
                        }
                    }
                    
                    if (msg.emoji) {
                        messageData.text = msg.emoji;
                    }
                    
                    if (msg.mentions && messageData.text) {
                    }
                    
                    if (msg.location) {
                        console.warn("[ig-chat-api] Location sharing not directly supported, sending as text");
                        const { latitude, longitude } = msg.location;
                        if (!messageData.text) {
                            messageData.text = `Location: https://maps.google.com/?q=${latitude},${longitude}`;
                        }
                    }
                }
                
                if (!messageData.text && !messageData.attachment) {
                    return callback({ error: "Message must contain text or attachment" });
                }
                
                const requestBody = {
                    recipient: { id: threadID.toString() },
                    message: messageData,
                    messaging_type: "RESPONSE"
                };
                
                if (replyToMessage) {
                    requestBody.reply_to = { mid: replyToMessage };
                }
                
                const url = `${graphApiBase}/${apiVersion}/${pageID}/messages`;
                
                let retries = 3;
                let lastError;
                
                while (retries > 0) {
                    try {
                        const response = await axios.post(url, requestBody, {
                            params: { access_token: accessToken },
                            headers: { "Content-Type": "application/json" },
                            timeout: 30000
                        });
                        
                        const messageInfo = {
                            threadID: threadID.toString(),
                            messageID: response.data.message_id,
                            timestamp: Date.now()
                        };
                        
                        return callback(null, messageInfo);
                        
                    } catch (error) {
                        lastError = error;
                        const graphError = error.response?.data?.error;
                        
                        if (graphError?.code === 613 || graphError?.code === 4) {
                            console.log("[ig-chat-api] Rate limited, waiting before retry...");
                            await new Promise(r => setTimeout(r, 2000 * (4 - retries)));
                            retries--;
                        } else {
                            break;
                        }
                    }
                }
                
                const errorMsg = lastError.response?.data?.error?.message || lastError.message;
                console.error("[ig-chat-api] sendMessage failed:", errorMsg);
                callback({ error: errorMsg, code: lastError.response?.data?.error?.code });
                
            } catch (error) {
                console.error("[ig-chat-api] sendMessage error:", error.message);
                callback({ error: error.message });
            }
        })();
        
        return returnPromise;
    };
};
