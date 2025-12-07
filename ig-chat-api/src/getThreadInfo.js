"use strict";

module.exports = function(ctx) {
    return function getThreadInfo(threadID, callback) {
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
        
        ctx.axios.get(`/api/v1/direct_v2/threads/${threadID}/`, {
            params: {
                visual_message_return_type: "unseen"
            },
            headers: {
                "User-Agent": ctx.globalOptions.userAgent,
                "X-IG-App-ID": "936619743392459",
                "X-CSRFToken": ctx.csrfToken
            }
        })
        .then(response => {
            if (response.data && response.data.thread) {
                const thread = response.data.thread;
                const users = thread.users || [];
                
                const participantIDs = users.map(u => u.pk?.toString());
                participantIDs.push(ctx.userID);
                
                const userInfo = {};
                for (const user of users) {
                    userInfo[user.pk?.toString()] = {
                        id: user.pk?.toString(),
                        name: user.full_name || user.username,
                        firstName: user.full_name?.split(" ")[0] || user.username,
                        vanity: user.username,
                        username: user.username,
                        thumbSrc: user.profile_pic_url,
                        profileUrl: `https://instagram.com/${user.username}`,
                        gender: null,
                        type: "user"
                    };
                }
                
                const adminIDs = (thread.admin_user_ids || []).map(id => ({
                    id: id.toString()
                }));
                
                const threadInfo = {
                    threadID: thread.thread_id,
                    threadName: thread.thread_title || null,
                    participantIDs: participantIDs,
                    userInfo: users.map(u => ({
                        id: u.pk?.toString(),
                        name: u.full_name || u.username,
                        firstName: u.full_name?.split(" ")[0] || u.username,
                        vanity: u.username,
                        username: u.username,
                        thumbSrc: u.profile_pic_url,
                        profileUrl: `https://instagram.com/${u.username}`,
                        gender: null,
                        type: "user"
                    })),
                    nicknames: {},
                    unreadCount: thread.read_state || 0,
                    messageCount: thread.items?.length || 0,
                    imageSrc: thread.thread_image?.url || null,
                    timestamp: thread.last_activity_at,
                    muteUntil: null,
                    isGroup: thread.thread_type === "group" || users.length > 1,
                    isSubscribed: true,
                    isArchived: false,
                    folder: "inbox",
                    cannotReplyReason: null,
                    eventReminders: [],
                    emoji: null,
                    color: null,
                    adminIDs: adminIDs,
                    approvalMode: thread.approval_required_for_new_members || false,
                    approvalQueue: [],
                    reactionsMuteMode: "default",
                    mentionsMuteMode: "default",
                    isPinProtected: false,
                    relatedPageThread: null
                };
                
                callback(null, threadInfo);
            } else {
                callback(null, {
                    threadID: threadID,
                    threadName: null,
                    participantIDs: [ctx.userID],
                    userInfo: [],
                    nicknames: {},
                    unreadCount: 0,
                    messageCount: 0,
                    imageSrc: null,
                    timestamp: Date.now(),
                    muteUntil: null,
                    isGroup: false,
                    isSubscribed: true,
                    isArchived: false,
                    folder: "inbox",
                    cannotReplyReason: null,
                    adminIDs: [],
                    approvalMode: false
                });
            }
        })
        .catch(error => {
            callback(null, {
                threadID: threadID,
                threadName: null,
                participantIDs: [ctx.userID],
                userInfo: [],
                nicknames: {},
                unreadCount: 0,
                messageCount: 0,
                imageSrc: null,
                timestamp: Date.now(),
                muteUntil: null,
                isGroup: false,
                isSubscribed: true,
                isArchived: false,
                folder: "inbox",
                cannotReplyReason: null,
                adminIDs: [],
                approvalMode: false
            });
        });
        
        return returnPromise;
    };
};
