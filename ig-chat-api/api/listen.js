"use strict";

const express = require("express");
const { parseWebhookBody } = require("../utils/formatIGEventToFCA");

/**
 * listen - FCA-compatible event listener for Instagram
 * 
 * Uses Express webhook server to receive Instagram events
 * and converts them to FCA-style events for GoatBot compatibility
 * 
 * Usage (same as fb-chat-api):
 *   api.listen((err, event) => {
 *     console.log(event.body);
 *   });
 */

module.exports = function(ctx, api) {
    
    let webhookApp = null;
    let webhookServer = null;
    let isListening = false;
    let eventCallback = null;
    
    function createWebhookServer(port, callback) {
        webhookApp = express();
        webhookApp.use(express.json());
        
        webhookApp.get("/webhook", (req, res) => {
            const mode = req.query["hub.mode"];
            const token = req.query["hub.verify_token"];
            const challenge = req.query["hub.challenge"];
            
            console.log("[ig-chat-api] Webhook verification request");
            
            if (mode === "subscribe" && token === ctx.verifyToken) {
                console.log("[ig-chat-api] Webhook verified successfully!");
                res.status(200).send(challenge);
            } else {
                console.error("[ig-chat-api] Webhook verification failed");
                console.error(`[ig-chat-api] Expected: ${ctx.verifyToken}, Got: ${token}`);
                res.status(403).send("Forbidden");
            }
        });
        
        webhookApp.post("/webhook", (req, res) => {
            res.status(200).send("EVENT_RECEIVED");
            
            try {
                const events = parseWebhookBody(req.body, ctx.pageID);
                
                for (const event of events) {
                    if (eventCallback) {
                        setImmediate(() => {
                            eventCallback(null, event);
                        });
                    }
                }
            } catch (error) {
                console.error("[ig-chat-api] Webhook processing error:", error.message);
            }
        });
        
        webhookApp.get("/", (req, res) => {
            res.json({
                status: "running",
                platform: "ig-chat-api",
                pageID: ctx.pageID,
                uptime: process.uptime()
            });
        });
        
        webhookApp.get("/health", (req, res) => {
            res.json({ status: "ok", timestamp: Date.now() });
        });
        
        webhookServer = webhookApp.listen(port, "0.0.0.0", () => {
            console.log(`[ig-chat-api] Webhook server running on port ${port}`);
            console.log(`[ig-chat-api] Webhook URL: https://YOUR_DOMAIN/webhook`);
            console.log(`[ig-chat-api] Verify Token: ${ctx.verifyToken}`);
            console.log("[ig-chat-api] Waiting for Instagram messages...");
            
            if (callback) callback();
        });
        
        webhookServer.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.log(`[ig-chat-api] Port ${port} in use, trying to connect to existing server...`);
            } else {
                console.error("[ig-chat-api] Webhook server error:", error.message);
            }
        });
        
        api.handleWebhook = (req, res) => {
            if (req.method === "GET") {
                const mode = req.query["hub.mode"];
                const token = req.query["hub.verify_token"];
                const challenge = req.query["hub.challenge"];
                
                if (mode === "subscribe" && token === ctx.verifyToken) {
                    return res.status(200).send(challenge);
                }
                return res.status(403).send("Forbidden");
            }
            
            if (req.method === "POST") {
                res.status(200).send("EVENT_RECEIVED");
                
                const events = parseWebhookBody(req.body, ctx.pageID);
                for (const event of events) {
                    if (eventCallback) {
                        setImmediate(() => eventCallback(null, event));
                    }
                }
                return;
            }
            
            res.status(405).send("Method not allowed");
        };
        
        api.verifyWebhook = (req, res) => {
            const mode = req.query["hub.mode"];
            const token = req.query["hub.verify_token"];
            const challenge = req.query["hub.challenge"];
            
            if (mode === "subscribe" && token === ctx.verifyToken) {
                return res.status(200).send(challenge);
            }
            return res.status(403).send("Forbidden");
        };
    }
    
    return function listen(callback) {
        if (typeof callback !== "function") {
            throw new Error("listen() requires a callback function");
        }
        
        eventCallback = callback;
        
        if (!isListening) {
            isListening = true;
            const port = ctx.globalOptions.webhookPort || 5000;
            createWebhookServer(port, () => {
                console.log("[ig-chat-api] Listen started successfully");
            });
        }
        
        const stopListening = () => {
            isListening = false;
            eventCallback = null;
            
            if (webhookServer) {
                webhookServer.close(() => {
                    console.log("[ig-chat-api] Webhook server stopped");
                });
                webhookServer = null;
            }
            
            console.log("[ig-chat-api] Stopped listening");
        };
        
        ctx.stopListening = stopListening;
        
        return stopListening;
    };
};
