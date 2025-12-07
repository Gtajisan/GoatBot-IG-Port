"use strict";

const axios = require("axios");

/**
 * getUserInfo - FCA-compatible user info fetcher for Instagram
 * 
 * Usage (same as fb-chat-api):
 *   api.getUserInfo(userID, (err, info) => { ... });
 *   api.getUserInfo([userID1, userID2], (err, info) => { ... });
 */

const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

module.exports = function(ctx) {
    
    return function getUserInfo(userIDs, callback) {
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
                const { accessToken, graphApiBase, apiVersion } = ctx;
                
                if (!Array.isArray(userIDs)) {
                    userIDs = [userIDs];
                }
                
                const result = {};
                const toFetch = [];
                const now = Date.now();
                
                for (const userID of userIDs) {
                    const cached = userCache.get(userID.toString());
                    if (cached && (now - cached.timestamp) < CACHE_TTL) {
                        result[userID] = cached.data;
                    } else {
                        toFetch.push(userID);
                    }
                }
                
                for (const userID of toFetch) {
                    try {
                        const url = `${graphApiBase}/${apiVersion}/${userID}`;
                        const response = await axios.get(url, {
                            params: {
                                access_token: accessToken,
                                fields: "id,name,username,profile_pic"
                            },
                            timeout: 10000
                        });
                        
                        const data = response.data;
                        const userInfo = {
                            name: data.name || data.username || "Instagram User",
                            firstName: (data.name || data.username || "Instagram").split(" ")[0],
                            vanity: data.username || "",
                            thumbSrc: data.profile_pic || "",
                            profileUrl: data.username ? `https://instagram.com/${data.username}` : "",
                            gender: null,
                            type: "user",
                            isFriend: false,
                            isBirthday: false,
                            searchTokens: [],
                            alternateName: "",
                            id: userID.toString()
                        };
                        
                        result[userID] = userInfo;
                        userCache.set(userID.toString(), {
                            data: userInfo,
                            timestamp: now
                        });
                        
                    } catch (error) {
                        result[userID] = {
                            name: "Instagram User",
                            firstName: "Instagram",
                            vanity: "",
                            thumbSrc: "",
                            profileUrl: "",
                            gender: null,
                            type: "user",
                            isFriend: false,
                            isBirthday: false,
                            searchTokens: [],
                            alternateName: "",
                            id: userID.toString()
                        };
                        
                        if (ctx.globalOptions.logLevel !== "silent") {
                            console.warn(`[ig-chat-api] Could not fetch info for user ${userID}`);
                        }
                    }
                }
                
                callback(null, result);
                
            } catch (error) {
                console.error("[ig-chat-api] getUserInfo error:", error.message);
                callback({ error: error.message });
            }
        })();
        
        return returnPromise;
    };
};
