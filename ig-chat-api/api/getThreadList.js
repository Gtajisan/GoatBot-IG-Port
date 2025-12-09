"use strict";

const axios = require("axios");

/**
 * getThreadList - FCA-compatible thread list fetcher for Instagram
 * 
 * Usage (same as fb-chat-api):
 *   api.getThreadList(limit, timestamp, tags, (err, threads) => { ... });
 */

module.exports = function(ctx) {
    
    return function getThreadList(limit, timestamp, tags, callback) {
        if (typeof limit === "function") {
            callback = limit;
            limit = 20;
            timestamp = null;
            tags = [];
        } else if (typeof timestamp === "function") {
            callback = timestamp;
            timestamp = null;
            tags = [];
        } else if (typeof tags === "function") {
            callback = tags;
            tags = [];
        }
        
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
                
                const url = `${graphApiBase}/${apiVersion}/${pageID}/conversations`;
                const response = await axios.get(url, {
                    params: {
                        access_token: accessToken,
                        fields: "id,participants,updated_time,message_count,unread_count",
                        limit: limit || 20,
                        platform: "instagram"
                    },
                    timeout: 15000
                });
                
                const threads = (response.data.data || []).map(convo => {
                    const participants = convo.participants?.data || [];
                    const otherParticipant = participants.find(p => p.id !== pageID) || participants[0] || {};
                    
                    return {
                        threadID: convo.id,
                        name: otherParticipant.name || "Instagram Chat",
                        unreadCount: convo.unread_count || 0,
                        messageCount: convo.message_count || 0,
                        imageSrc: null,
                        timestamp: convo.updated_time ? new Date(convo.updated_time).getTime() : Date.now(),
                        muteUntil: null,
                        isGroup: false,
                        isSubscribed: true,
                        folder: "inbox",
                        isArchived: false,
                        cannotReplyReason: null,
                        
                        participantIDs: participants.map(p => p.id),
                        
                        participants: participants.map(p => ({
                            userID: p.id,
                            name: p.name || "Instagram User",
                            email: p.email || null
                        })),
                        
                        snippet: "",
                        snippetAttachments: [],
                        snippetSender: null
                    };
                });
                
                callback(null, threads);
                
            } catch (error) {
                console.error("[ig-chat-api] getThreadList error:", error.message);
                callback(null, []);
            }
        })();
        
        return returnPromise;
    };
};
