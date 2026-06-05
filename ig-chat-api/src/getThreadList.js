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

function snippetFromItem(item) {
    if (!item) return "";
    switch (item.item_type) {
        case "text"        : return item.text || "";
        case "media"       :
        case "media_share" : return "[Photo]";
        case "voice_media" : return "[Voice Message]";
        case "reel_share"  : return "[Reel]";
        case "story_share" : return "[Story]";
        case "link"        : return "[Link]";
        case "like"        : return item.like || "❤️";
        default            : return "[Message]";
    }
}

function formatThread(thread, botUserID) {
    const users = thread.users || [];
    const participantIDs = [...new Set([
        ...users.map(u => (u.pk || u.user_id || "").toString()),
        botUserID
    ])];
    const lastItem = (thread.items || [])[0];

    return {
        threadID     : thread.thread_id,
        name         : thread.thread_title || users.map(u => u.username).filter(Boolean).join(", ") || "Unknown",
        unreadCount  : thread.read_state || 0,
        messageCount : (thread.items || []).length,
        imageSrc     : thread.thread_image?.url || users[0]?.profile_pic_url || null,
        emoji        : null,
        color        : null,
        nicknames    : {},
        muteUntil    : null,
        participants : users.map(u => ({
            accountType    : u.is_business ? "business" : "user",
            userID         : (u.pk || u.user_id || "").toString(),
            name           : u.full_name || u.username || "",
            shortName      : u.username || "",
            gender         : null,
            url            : u.username ? `https://www.instagram.com/${u.username}/` : "",
            profilePicture : u.profile_pic_url || "",
            username       : u.username || "",
            isVerified     : u.is_verified || false
        })),
        participantIDs,
        snippet        : snippetFromItem(lastItem),
        snippetHasAttachment: lastItem?.item_type !== "text",
        snippetSender  : lastItem ? (lastItem.user_id || "").toString() : null,
        timestamp      : thread.last_activity_at || Date.now(),
        serverTimestamp: thread.last_activity_at || Date.now(),
        isGroup        : thread.thread_type === "group" || users.length > 1,
        isSubscribed   : true,
        folder         : "inbox",
        isArchived     : false,
        adminIDs       : (thread.admin_user_ids || []).map(id => ({ id: id.toString() })),
        approvalMode   : thread.approval_required_for_new_members || false
    };
}

module.exports = function(ctx) {
    return function getThreadList(limit, timestamp, tags, callback) {
        if (typeof limit === "function")     { callback = limit;     limit = 20; }
        else if (typeof timestamp === "function") { callback = timestamp; }
        else if (typeof tags === "function") { callback = tags; }

        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc  = reject;
        });

        if (typeof callback !== "function") {
            callback = (err, info) => { if (err) return rejectFunc(err); resolveFunc(info); };
        }

        ctx.axios.get("https://www.instagram.com/api/v1/direct_v2/inbox/", {
            params : {
                visual_message_return_type : "unseen",
                persistentBadging          : "true",
                limit                      : limit || 20
            },
            headers: getHeaders(ctx),
            timeout: 15000
        })
        .then(res => {
            const threads = (res.data?.inbox?.threads || []).map(t => formatThread(t, ctx.userID));
            callback(null, threads);
        })
        .catch(err => callback(err));

        return returnPromise;
    };
};
