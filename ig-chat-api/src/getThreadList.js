"use strict";

module.exports = function(ctx) {
    return function getThreadList(limit, timestamp, tags, callback) {
        if (typeof limit === "function") {
            callback = limit;
            limit = 20;
            timestamp = null;
            tags = ["INBOX"];
        } else if (typeof timestamp === "function") {
            callback = timestamp;
            timestamp = null;
            tags = ["INBOX"];
        } else if (typeof tags === "function") {
            callback = tags;
            tags = ["INBOX"];
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
        
        ctx.axios.get("/api/v1/direct_v2/inbox/", {
            params: {
                visual_message_return_type: "unseen",
                persistentBadging: true,
                limit: limit || 20
            },
            headers: {
                "User-Agent": ctx.globalOptions.userAgent,
                "X-IG-App-ID": "936619743392459",
                "X-CSRFToken": ctx.csrfToken
            }
        })
        .then(response => {
            if (response.data && response.data.inbox) {
                const threads = (response.data.inbox.threads || []).map(thread => {
                    const users = thread.users || [];
                    const participantIDs = users.map(u => u.pk?.toString());
                    participantIDs.push(ctx.userID);
                    
                    const lastMessage = thread.items?.[0];
                    let snippet = "";
                    
                    if (lastMessage) {
                        switch (lastMessage.item_type) {
                            case "text":
                                snippet = lastMessage.text || "";
                                break;
                            case "media":
                            case "media_share":
                                snippet = "[Photo]";
                                break;
                            case "voice_media":
                                snippet = "[Voice Message]";
                                break;
                            case "reel_share":
                                snippet = "[Reel]";
                                break;
                            case "story_share":
                                snippet = "[Story]";
                                break;
                            case "link":
                                snippet = "[Link]";
                                break;
                            default:
                                snippet = "[Message]";
                        }
                    }
                    
                    return {
                        threadID: thread.thread_id,
                        name: thread.thread_title || users.map(u => u.username).join(", ") || "Unknown",
                        unreadCount: thread.read_state || 0,
                        messageCount: thread.items?.length || 0,
                        imageSrc: thread.thread_image?.url || users[0]?.profile_pic_url || null,
                        emoji: null,
                        color: null,
                        nicknames: {},
                        muteUntil: null,
                        participants: users.map(u => ({
                            accountType: u.is_business ? "business" : "user",
                            userID: u.pk?.toString(),
                            name: u.full_name || u.username,
                            shortName: u.username,
                            gender: null,
                            url: `https://instagram.com/${u.username}`,
                            profilePicture: u.profile_pic_url,
                            username: u.username,
                            isVerified: u.is_verified
                        })),
                        participantIDs: participantIDs,
                        snippet: snippet,
                        snippetHasAttachment: lastMessage?.item_type !== "text",
                        snippetSender: lastMessage?.user_id?.toString() || null,
                        timestamp: thread.last_activity_at,
                        serverTimestamp: thread.last_activity_at,
                        isGroup: thread.thread_type === "group" || users.length > 1,
                        isSubscribed: true,
                        folder: "inbox",
                        isArchived: false,
                        recipientsLoadable: true,
                        lastMessageTimestamp: thread.last_activity_at,
                        inviteLink: thread.thread_v2_id ? {
                            enable: false,
                            link: null
                        } : null,
                        adminIDs: (thread.admin_user_ids || []).map(id => ({ id: id.toString() })),
                        approvalMode: thread.approval_required_for_new_members || false
                    };
                });
                
                callback(null, threads);
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
