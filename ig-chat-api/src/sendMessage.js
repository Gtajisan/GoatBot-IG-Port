"use strict";

const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");

function generateClientContext() {
    return Math.floor(Math.random() * 9007199254740991).toString();
}

function generateMutationToken() {
    return Math.floor(Math.random() * 1e18).toString();
}

module.exports = function(ctx, api) {
    return function sendMessage(msg, threadID, messageID, callback) {
        if (typeof messageID === "function") {
            callback = messageID;
            messageID = null;
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
        
        let body = "";
        let attachment = null;
        let sticker = null;
        let url = null;
        
        if (typeof msg === "string") {
            body = msg;
        } else if (typeof msg === "object") {
            body = msg.body || "";
            attachment = msg.attachment;
            sticker = msg.sticker;
            url = msg.url;
        }
        
        const clientContext = generateClientContext();
        const mutationToken = generateMutationToken();
        
        const sendTextMessage = () => {
            const payload = {
                action: "send_item",
                is_shh_mode: "0",
                send_attribution: "direct_thread",
                client_context: clientContext,
                mutation_token: mutationToken,
                thread_ids: `[${threadID}]`,
                text: body
            };
            
            if (messageID) {
                payload.replied_to_item_id = messageID;
            }
            
            return ctx.axios.post("/api/v1/direct_v2/threads/broadcast/text/", 
                new URLSearchParams(payload).toString(),
                {
                    headers: {
                        ...api.getHeaders(),
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }
            )
            .then(response => {
                if (response.data && response.data.status === "ok") {
                    const messageInfo = {
                        threadID: threadID,
                        messageID: response.data.payload?.item_id || clientContext,
                        timestamp: Date.now()
                    };
                    callback(null, messageInfo);
                } else {
                    throw new Error(response.data?.message || "Failed to send message");
                }
            })
            .catch(error => {
                if (error.response?.status === 400) {
                    return sendTextMessageGraphQL();
                }
                callback(error);
            });
        };
        
        const sendTextMessageGraphQL = () => {
            const variables = {
                thread_id: threadID.toString(),
                client_context: clientContext,
                mutation_token: mutationToken,
                text: body
            };
            
            if (messageID) {
                variables.replied_to_item_id = messageID;
            }
            
            return ctx.axios.post("/api/v1/direct_v2/threads/" + threadID + "/items/", 
                new URLSearchParams({
                    text: body,
                    action: "text"
                }).toString(),
                {
                    headers: {
                        ...api.getHeaders(),
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }
            )
            .then(response => {
                const messageInfo = {
                    threadID: threadID,
                    messageID: clientContext,
                    timestamp: Date.now()
                };
                callback(null, messageInfo);
            })
            .catch(error => {
                callback(error);
            });
        };
        
        const sendAttachment = async () => {
            try {
                let attachments = Array.isArray(attachment) ? attachment : [attachment];
                
                for (const att of attachments) {
                    if (att.readable || att.pipe) {
                        const form = new FormData();
                        form.append("thread_id", threadID.toString());
                        form.append("upload_id", Date.now().toString());
                        form.append("photo", att, {
                            filename: "image.jpg",
                            contentType: "image/jpeg"
                        });
                        
                        await ctx.axios.post("/rupload_igphoto/", form, {
                            headers: {
                                ...form.getHeaders(),
                                ...api.getHeaders()
                            }
                        });
                    } else if (typeof att === "string") {
                        if (fs.existsSync(att)) {
                            const fileStream = fs.createReadStream(att);
                            const form = new FormData();
                            form.append("thread_id", threadID.toString());
                            form.append("photo", fileStream);
                            
                            await ctx.axios.post("/rupload_igphoto/", form, {
                                headers: {
                                    ...form.getHeaders(),
                                    ...api.getHeaders()
                                }
                            });
                        }
                    }
                }
                
                if (body) {
                    await sendTextMessage();
                } else {
                    const messageInfo = {
                        threadID: threadID,
                        messageID: clientContext,
                        timestamp: Date.now()
                    };
                    callback(null, messageInfo);
                }
            } catch (error) {
                callback(error);
            }
        };
        
        if (attachment) {
            sendAttachment();
        } else if (body) {
            sendTextMessage();
        } else {
            callback(new Error("Message body or attachment is required"));
        }
        
        return returnPromise;
    };
};
