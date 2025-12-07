"use strict";

const axios = require("axios");

/**
 * getThreadInfo - FCA-compatible thread info fetcher for Instagram
 * 
 * Usage (same as fb-chat-api):
 *   api.getThreadInfo(threadID, (err, info) => { ... });
 */

module.exports = function(ctx) {
    
    return function getThreadInfo(threadID, callback) {
        let resolveFunc, rejectFunc;
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        
        if (typeof callback !== "function") {
            callback = (err, result) => {
                if (err) return rejectFunc(err);
                resolveFunc(result);
            };
        }
        
        (async () => {
            try {
                const { accessToken, pageID, graphApiBase, apiVersion } = ctx;
                
                let userData = {
                    name: "Instagram User",
                    username: ""
                };
                
                try {
                    const url = `${graphApiBase}/${apiVersion}/${threadID}`;
                    const response = await axios.get(url, {
                        params: {
                            access_token: accessToken,
                            fields: "id,name,username,profile_pic"
                        },
                        timeout: 10000
                    });
                    userData = response.data;
                } catch (e) {
                }
                
                const threadInfo = {
                    threadID: threadID.toString(),
                    threadName: userData.name || userData.username || "Instagram Chat",
                    participantIDs: [threadID.toString(), pageID],
                    userInfo: [{
                        id: threadID.toString(),
                        name: userData.name || userData.username || "Instagram User",
                        firstName: (userData.name || userData.username || "User").split(" ")[0],
                        vanity: userData.username || "",
                        thumbSrc: userData.profile_pic || "",
                        profileUrl: userData.username ? `https://instagram.com/${userData.username}` : "",
                        gender: null,
                        type: "user",
                        isFriend: false,
                        isBirthday: false
                    }],
                    
                    name: userData.name || userData.username || "Instagram Chat",
                    unreadCount: 0,
                    messageCount: 0,
                    imageSrc: userData.profile_pic || null,
                    timestamp: Date.now(),
                    muteUntil: null,
                    isGroup: false,
                    isSubscribed: true,
                    folder: "inbox",
                    isArchived: false,
                    cannotReplyReason: null,
                    lastReadTimestamp: Date.now(),
                    emoji: null,
                    color: null,
                    nicknames: {},
                    adminIDs: [],
                    approvalMode: false,
                    approvalQueue: [],
                    reactionsMuteMode: "reactions_not_muted",
                    mentionsMuteMode: "mentions_not_muted",
                    isPinProtected: false,
                    relatedPageThread: null,
                    
                    inviteLink: {
                        enable: false,
                        link: null
                    }
                };
                
                callback(null, threadInfo);
                
            } catch (error) {
                console.error("[ig-chat-api] getThreadInfo error:", error.message);
                callback({ error: error.message });
            }
        })();
        
        return returnPromise;
    };
};
