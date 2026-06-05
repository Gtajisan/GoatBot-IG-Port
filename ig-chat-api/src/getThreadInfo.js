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

function buildThreadInfo(thread, botUserID) {
    const users = thread.users || [];
    const allIDs = [...new Set([
        ...users.map(u => (u.pk || u.user_id || "").toString()),
        botUserID
    ])];

    return {
        threadID       : thread.thread_id,
        threadName     : thread.thread_title || null,
        participantIDs : allIDs,
        userInfo       : users.map(u => ({
            id         : (u.pk || u.user_id || "").toString(),
            name       : u.full_name || u.username || "",
            firstName  : (u.full_name || u.username || "").split(" ")[0],
            vanity     : u.username || "",
            username   : u.username || "",
            thumbSrc   : u.profile_pic_url || "",
            profileUrl : u.username ? `https://www.instagram.com/${u.username}/` : "",
            gender     : null,
            type       : u.is_business ? "business" : "user",
            isVerified : u.is_verified || false
        })),
        nicknames      : {},
        unreadCount    : thread.read_state || 0,
        messageCount   : (thread.items || []).length,
        imageSrc       : thread.thread_image?.url || null,
        timestamp      : thread.last_activity_at || Date.now(),
        muteUntil      : null,
        isGroup        : thread.thread_type === "group" || users.length > 1,
        isSubscribed   : true,
        isArchived     : false,
        folder         : "inbox",
        cannotReplyReason: null,
        emoji          : null,
        color          : null,
        adminIDs       : (thread.admin_user_ids || []).map(id => ({ id: id.toString() })),
        approvalMode   : thread.approval_required_for_new_members || false,
        approvalQueue  : []
    };
}

module.exports = function(ctx) {
    return function getThreadInfo(threadID, callback) {
        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc  = reject;
        });

        if (typeof callback !== "function") {
            callback = (err, info) => { if (err) return rejectFunc(err); resolveFunc(info); };
        }

        const fallback = {
            threadID, threadName: null, participantIDs: [ctx.userID],
            userInfo: [], nicknames: {}, unreadCount: 0, messageCount: 0,
            imageSrc: null, timestamp: Date.now(), muteUntil: null,
            isGroup: false, isSubscribed: true, isArchived: false,
            folder: "inbox", cannotReplyReason: null, adminIDs: [], approvalMode: false
        };

        ctx.axios.get(`https://www.instagram.com/api/v1/direct_v2/threads/${threadID}/`, {
            params : { visual_message_return_type: "unseen" },
            headers: getHeaders(ctx),
            timeout: 15000
        })
        .then(res => {
            if (res.data?.thread) {
                callback(null, buildThreadInfo(res.data.thread, ctx.userID));
            } else {
                callback(null, fallback);
            }
        })
        .catch(() => callback(null, fallback));

        return returnPromise;
    };
};
