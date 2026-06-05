"use strict";

const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");

const IG_APP_ID = "936619743392459";

function getHeaders(ctx) {
    return {
        "User-Agent"       : ctx.globalOptions.userAgent,
        "Accept"           : "*/*",
        "Accept-Language"  : "en-US,en;q=0.9",
        "X-IG-App-ID"      : IG_APP_ID,
        "X-ASBD-ID"        : "129477",
        "X-IG-WWW-Claim"   : ctx.wwwClaim || "0",
        "X-Requested-With" : "XMLHttpRequest",
        "X-CSRFToken"      : ctx.csrfToken || "",
        "Origin"           : "https://www.instagram.com",
        "Referer"          : "https://www.instagram.com/direct/inbox/",
        "Sec-Fetch-Dest"   : "empty",
        "Sec-Fetch-Mode"   : "cors",
        "Sec-Fetch-Site"   : "same-origin"
    };
}

function genClientContext() {
    return (BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000))).toString();
}

module.exports = function(ctx, api) {
    return function sendMessage(msg, threadID, messageID, callback) {
        if (typeof messageID === "function") {
            callback = messageID;
            messageID = null;
        }
        if (typeof callback !== "function" && typeof messageID !== "string") {
            messageID = null;
        }

        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc  = reject;
        });

        if (typeof callback !== "function") {
            callback = (err, info) => {
                if (err) return rejectFunc(err);
                resolveFunc(info);
            };
        }

        let body = "";
        let attachment = null;

        if (typeof msg === "string") {
            body = msg;
        } else if (msg && typeof msg === "object") {
            body       = msg.body || msg.text || "";
            attachment = msg.attachment || null;
        }

        const clientContext = genClientContext();
        const threadIDStr   = threadID.toString();
        const headers       = getHeaders(ctx);

        const postForm = (url, params) => {
            const payload = new URLSearchParams(params).toString();
            return ctx.axios.post(url, payload, {
                headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" }
            });
        };

        const sendText = () => {
            const params = {
                action         : "send_item",
                is_shh_mode    : "0",
                send_attribution: "direct_thread",
                client_context : clientContext,
                mutation_token : clientContext,
                _uuid          : ctx.clientID || clientContext,
                _csrftoken     : ctx.csrfToken || "",
                thread_ids     : JSON.stringify([threadIDStr]),
                text           : body
            };

            if (messageID) params.replied_to_item_id = messageID;

            return postForm("/api/v1/direct_v2/threads/broadcast/text/", params)
                .then(res => {
                    if (res.data && (res.data.status === "ok" || res.data.payload)) {
                        return {
                            threadID  : threadIDStr,
                            messageID : res.data.payload?.item_id || clientContext,
                            timestamp : Date.now()
                        };
                    }
                    throw new Error(res.data?.message || "Send failed");
                });
        };

        const sendLink = (linkUrl) => {
            const params = {
                action          : "send_item",
                client_context  : clientContext,
                mutation_token  : clientContext,
                _uuid           : ctx.clientID || clientContext,
                _csrftoken      : ctx.csrfToken || "",
                thread_ids      : JSON.stringify([threadIDStr]),
                link_text       : body || linkUrl,
                link_urls       : JSON.stringify([linkUrl])
            };
            return postForm("/api/v1/direct_v2/threads/broadcast/link/", params)
                .then(res => ({
                    threadID  : threadIDStr,
                    messageID : res.data?.payload?.item_id || clientContext,
                    timestamp : Date.now()
                }));
        };

        const sendPhoto = async (stream, filename) => {
            const uploadID = Date.now().toString();
            const form = new FormData();
            form.append("upload_id", uploadID);
            form.append("_uuid", ctx.clientID || clientContext);
            form.append("_csrftoken", ctx.csrfToken || "");
            form.append("image_compression", JSON.stringify({ lib_name: "moz", lib_version: "3.1.m", quality: "80" }));
            form.append("photo", stream, { filename: filename || "photo.jpg", contentType: "image/jpeg" });

            await ctx.axios.post(`/rupload_igphoto/${uploadID}_0`, form, {
                headers: {
                    ...headers,
                    ...form.getHeaders(),
                    "X-Entity-Type"   : "image/jpeg",
                    "X-Entity-Name"   : filename || "photo.jpg",
                    "X-Instagram-Rupload-Params": JSON.stringify({
                        upload_id    : uploadID,
                        media_type   : 1,
                        retry_context: '{"num_step_auto_retry":0,"num_reupload":0,"num_step_manual_retry":0}',
                        image_compression: JSON.stringify({ lib_name: "moz", lib_version: "3.1.m", quality: "80" })
                    })
                }
            });

            const params = {
                action         : "send_item",
                client_context : clientContext,
                mutation_token : clientContext,
                _uuid          : ctx.clientID || clientContext,
                _csrftoken     : ctx.csrfToken || "",
                thread_ids     : JSON.stringify([threadIDStr]),
                upload_id      : uploadID,
                allow_full_aspect_ratio: "true"
            };

            if (body) params.caption = body;
            if (messageID) params.replied_to_item_id = messageID;

            return postForm("/api/v1/direct_v2/threads/broadcast/upload_photo/", params)
                .then(res => ({
                    threadID  : threadIDStr,
                    messageID : res.data?.payload?.item_id || clientContext,
                    timestamp : Date.now()
                }));
        };

        (async () => {
            try {
                if (attachment) {
                    const atts = Array.isArray(attachment) ? attachment : [attachment];
                    let lastInfo = null;

                    for (const att of atts) {
                        try {
                            if (att && (att.readable || (att.pipe && typeof att.pipe === "function"))) {
                                lastInfo = await sendPhoto(att, att.path ? path.basename(att.path) : "photo.jpg");
                            } else if (typeof att === "string" && fs.existsSync(att)) {
                                lastInfo = await sendPhoto(fs.createReadStream(att), path.basename(att));
                            } else if (typeof att === "string" && (att.startsWith("http://") || att.startsWith("https://"))) {
                                lastInfo = await sendLink(att);
                            }
                        } catch (attErr) {
                            console.error("[ig-chat-api] Attachment send error:", attErr.message);
                        }
                    }

                    if (body && !lastInfo) {
                        lastInfo = await sendText();
                    }

                    if (lastInfo) {
                        callback(null, lastInfo);
                    } else {
                        callback(new Error("Failed to send attachment"));
                    }
                } else if (body) {
                    const urlMatch = body.match(/https?:\/\/[^\s]+/);
                    if (urlMatch && body.trim() === urlMatch[0]) {
                        const info = await sendLink(body).catch(() => sendText());
                        callback(null, info);
                    } else {
                        const info = await sendText();
                        callback(null, info);
                    }
                } else {
                    callback(new Error("Message must have text or attachment"));
                }
            } catch (err) {
                const status = err.response?.status;
                const igMsg  = err.response?.data?.message || err.message;
                console.error(`[ig-chat-api] sendMessage error (${status || "?"}): ${igMsg}`);

                if (status === 400 && body) {
                    try {
                        const info = await sendText();
                        return callback(null, info);
                    } catch (e2) {}
                }

                callback({ error: igMsg, status });
            }
        })();

        return returnPromise;
    };
};
