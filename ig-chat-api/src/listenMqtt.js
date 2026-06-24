"use strict";

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

function formatItem(thread, item, botUserID) {
    const threadID  = thread.thread_id;
    const senderID  = (item.user_id || item.sender_id || "").toString();
    const messageID = item.item_id;
    const isGroup   = thread.thread_type === "group" || (thread.users || []).length > 1;

    let body        = "";
    let attachments = [];
    let type        = "message";

    switch (item.item_type) {
        case "text":
            body = item.text || "";
            break;

        case "media":
        case "media_share": {
            const media = item.media || item.media_share;
            const imgUrl = media?.image_versions2?.candidates?.[0]?.url
                        || media?.thumbnail_url
                        || null;
            const vidUrl = media?.video_versions?.[0]?.url || null;
            if (vidUrl) {
                attachments.push({ type: "video", url: vidUrl, ID: messageID });
            } else if (imgUrl) {
                attachments.push({ type: "photo", url: imgUrl, ID: messageID,
                    largePreviewUrl: imgUrl, previewUrl: imgUrl, thumbnailUrl: imgUrl });
            }
            if (media?.caption?.text) body = media.caption.text;
            break;
        }

        case "voice_media":
        case "audio": {
            const audioSrc = item.voice_media?.media?.audio?.audio_src
                          || item.audio?.audio_src
                          || null;
            if (audioSrc) attachments.push({ type: "audio", url: audioSrc, ID: messageID });
            break;
        }

        case "video_call_event":
            type = "event";
            body = item.video_call_event?.description || "[Video Call]";
            break;

        case "reel_share":
            body = item.reel_share?.text || "[Reel]";
            break;

        case "story_share":
            body = item.story_share?.text || "[Story Share]";
            break;

        case "link":
            body = item.link?.text || item.link?.link_context?.link_url || "";
            break;

        case "like":
            body = item.like || "❤️";
            break;

        case "xma_media_share":
        case "xma":
            body = item.xma_media_share?.preview_url ? "[Media]" : "[Share]";
            break;

        case "action_log":
            type = "event";
            body = item.action_log?.description || "";
            break;

        case "raven_media":
            attachments.push({ type: "photo", url: "", ID: messageID });
            body = "[Disappearing Media]";
            break;

        default:
            body = item.text || "";
    }

    const participantIDs = [...new Set([
        ...(thread.users || []).map(u => (u.pk || u.user_id || "").toString()),
        botUserID
    ])];

    const adminIDs = (thread.admin_user_ids || []).map(id => ({ id: id.toString() }));

    return {
        type,
        senderID,
        threadID,
        messageID,
        body,
        attachments,
        mentions      : {},
        timestamp     : item.timestamp || Date.now(),
        isGroup,
        participantIDs,
        threadName    : thread.thread_title || null,
        adminIDs,
        isUnread      : true,
        isEcho        : senderID === botUserID
    };
}

module.exports = function(ctx, api) {
    return function listenMqtt(callback) {
        let isListening     = true;
        let isFirstPoll     = true;
        let errorCount      = 0;
        const seen          = new Set();
        const MIN_DELAY     = ctx.globalOptions.instagramPolling?.minDelay || 5000;
        const MAX_DELAY     = ctx.globalOptions.instagramPolling?.maxDelay || 120000;
        const sleep         = ms => new Promise(r => setTimeout(r, ms));

        const getDelay = () => {
            if (errorCount === 0) {
                // Add some jitter even to base delay
                return MIN_DELAY + Math.floor(Math.random() * 2000);
            }
            return Math.min(MIN_DELAY * Math.pow(2, errorCount - 1), MAX_DELAY)
                   + Math.floor(Math.random() * 3000);
        };

        const emit = (event) => {
            try {
                if (callback) callback(null, event);
                api.emit("message", event);
            } catch (e) {
                console.error("[ig-chat-api] Handler error:", e.message);
            }
        };

        const pollInbox = async () => {
            const headers = getHeaders(ctx);
            let cursor    = null;
            let hasMore   = true;
            const allThreads = [];

            while (hasMore) {
                const params = {
                    persistentBadging       : "true",
                    folder                  : "",
                    limit                   : "20",
                    thread_message_limit    : "10",
                    visual_message_return_type: "unseen"
                };
                if (cursor) params.cursor = cursor;

                const res = await ctx.axios.get("https://www.instagram.com/api/v1/direct_v2/inbox/", {
                    params,
                    headers,
                    timeout: 20000
                });

                const inbox = res.data?.inbox;
                if (!inbox) break;

                allThreads.push(...(inbox.threads || []));
                hasMore = inbox.has_older && !isFirstPoll ? false : false;
                cursor  = inbox.oldest_cursor || null;
                break;
            }

            return allThreads;
        };

        const pollPending = async () => {
            try {
                const res = await ctx.axios.get("https://www.instagram.com/api/v1/direct_v2/pending-inbox/", {
                    params: { limit: "20" },
                    headers: getHeaders(ctx),
                    timeout: 20000
                });
                return res.data?.inbox?.threads || [];
            } catch (e) {
                return [];
            }
        };

        const processThreads = (threads) => {
            for (const thread of threads) {
                const items = thread.items || [];
                for (const item of items) {
                    const key = `${thread.thread_id}:${item.item_id}`;

                    if (isFirstPoll) {
                        seen.add(key);
                        continue;
                    }

                    if (seen.has(key)) continue;
                    seen.add(key);

                    if (seen.size > 2000) {
                        const arr = Array.from(seen);
                        arr.slice(0, arr.length - 1000).forEach(k => seen.delete(k));
                    }

                    const senderID = (item.user_id || item.sender_id || "").toString();
                    if (senderID === ctx.userID && !ctx.globalOptions.selfListen) continue;

                    const event = formatItem(thread, item, ctx.userID);
                    emit(event);

                    if (ctx.globalOptions.autoMarkDelivery) {
                        ctx.axios.post(
                            `https://www.instagram.com/api/v1/direct_v2/threads/${thread.thread_id}/items/${item.item_id}/seen/`,
                            new URLSearchParams({ use_unified_inbox: "true" }).toString(),
                            { headers: { ...getHeaders(ctx), "Content-Type": "application/x-www-form-urlencoded" } }
                        ).catch(() => {});
                    }
                }
            }
        };

        const run = async () => {
            console.log("[ig-chat-api] Starting polling listener (DMs + Groups)...");

            while (isListening) {
                try {
                    const [inbox, pending] = await Promise.all([pollInbox(), pollPending()]);
                    const allThreads = [...inbox, ...pending];

                    processThreads(allThreads);

                    if (isFirstPoll) {
                        isFirstPoll = false;
                        console.log(`[ig-chat-api] ✓ Initial sync done — watching ${allThreads.length} thread(s)...`);
                    }

                    errorCount = 0;
                } catch (err) {
                    errorCount++;
                    const status = err.response?.status;

                    if (status === 401 || status === 403) {
                        console.error("[ig-chat-api] Session expired (401/403) — stopping listener.");
                        isListening = false;
                        if (callback) callback(err);
                        return;
                    }

                    if (status === 429) {
                        console.warn("[ig-chat-api] Rate limited — cooling down 2 min...");
                        errorCount = Math.max(errorCount, 6);
                        await sleep(120000);
                        continue;
                    }

                    if (errorCount % 5 === 0) {
                        console.warn(`[ig-chat-api] Poll error #${errorCount}: ${err.message}`);
                    }
                }

                if (isListening) await sleep(getDelay());
            }
        };

        run();

        const stop = () => {
            isListening = false;
            console.log("[ig-chat-api] Listener stopped.");
        };

        ctx.stopListening = stop;
        return stop;
    };
};
