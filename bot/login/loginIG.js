"use strict";

/**
 * Instagram Login Handler — GoatBot V2 Pipeline
 * Proper integration with loadData.js, loadScripts.js, handlerAction.js
 */

process.stdout.write("\x1b]2;GoatBot V2 - Instagram Port by Gtajisan\x1b\x5c");

const fs   = require("fs");
const path = require("path");
const login = require("../../ig-chat-api");

const { dirAccount } = global.client;
const { config }     = global.GoatBot;
const { log, getText } = global.utils;

function createLine(sectionName) {
    const width = 62;
    const pad   = Math.max(0, Math.floor((width - sectionName.length - 2) / 2));
    const line  = "─".repeat(width);
    return `\n${line}\n${" ".repeat(pad)}[ ${sectionName} ]\n${line}`;
}

function parseCookiesFromText(text) {
    text = text.trim();

    if (text.startsWith("[")) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return parsed.map(c => ({
                    key         : c.key || c.name,
                    value       : c.value,
                    domain      : (c.domain || ".instagram.com").replace(/^\.?/, "."),
                    path        : c.path || "/",
                    hostOnly    : c.hostOnly || false,
                    creation    : new Date().toISOString(),
                    lastAccessed: new Date().toISOString()
                })).filter(c => c.key && c.value);
            }
        } catch (e) {}
    }

    if (text.includes("=")) {
        return text.split(";").map(c => {
            const [key, ...valParts] = c.trim().split("=");
            return {
                key         : key?.trim(),
                value       : valParts.join("=")?.trim(),
                domain      : ".instagram.com",
                path        : "/",
                hostOnly    : false,
                creation    : new Date().toISOString(),
                lastAccessed: new Date().toISOString()
            };
        }).filter(c => c.key && c.value);
    }

    return [];
}

(async function main() {
    // ─── 1. Read cookies ─────────────────────────────────────────────
    if (!fs.existsSync(dirAccount)) {
        log.error("LOGIN", `Cookie file not found: ${dirAccount}`);
        log.info("LOGIN", "Create account.txt with Instagram cookies (sessionid, ds_user_id, csrftoken)");
        process.exit(1);
    }

    const accountText = fs.readFileSync(dirAccount, "utf8").trim();
    if (!accountText) {
        log.error("LOGIN", "account.txt is empty — add your Instagram cookies");
        process.exit(1);
    }

    const appState = parseCookiesFromText(accountText);
    if (!appState.length) {
        log.error("LOGIN", "Could not parse cookies from account.txt");
        log.info("LOGIN", "Supported formats: JSON array, cookie string (key=value; key2=value2)");
        process.exit(1);
    }

    const hasSessionId = appState.some(c => c.key === "sessionid");
    const hasDsUserId  = appState.some(c => c.key === "ds_user_id");
    if (!hasSessionId || !hasDsUserId) {
        log.error("LOGIN", `Missing required cookies — sessionid:${hasSessionId ? "✓" : "✗"} ds_user_id:${hasDsUserId ? "✓" : "✗"}`);
        process.exit(1);
    }

    log.info("LOGIN", `Parsed ${appState.length} cookies from account.txt`);

    // ─── 2. Instagram login ──────────────────────────────────────────
    const loginOptions = {
        listenEvents     : config.optionsFca?.listenEvents    ?? true,
        selfListen       : config.optionsFca?.selfListen      ?? false,
        autoMarkDelivery : config.optionsFca?.autoMarkDelivery ?? false,
        autoMarkRead     : config.optionsFca?.autoMarkRead    ?? false,
        autoReconnect    : config.optionsFca?.autoReconnect   ?? true,
        logLevel         : config.optionsFca?.logLevel        ?? "info",
        userAgent        : config.instagramAccount?.userAgent
            || "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    };

    log.info("LOGIN", "Connecting to Instagram...");

    login({ appState }, loginOptions, async (err, api) => {
        if (err) {
            log.error("LOGIN", `Failed to login: ${err.message}`);
            log.info("LOGIN", "Check your cookies in account.txt — they may be expired");
            process.exit(1);
        }

        const botID = api.getCurrentUserID();
        global.GoatBot.botID = botID;
        global.GoatBot.igApi = api;

        log.success("LOGIN", `Logged in — Bot ID: ${botID}`);

        try {
            fs.writeFileSync(
                path.join(process.cwd(), "session.json"),
                JSON.stringify(api.getAppState(), null, 2)
            );
        } catch (e) {}

        // ─── 3. Load database ────────────────────────────────────────
        let threadModel, userModel, dashBoardModel, globalModel;
        let threadsData, usersData, dashBoardData, globalData;

        try {
            const loadData = require("./loadData.js");
            const db = await loadData(api, createLine);
            ({ threadModel, userModel, dashBoardModel, globalModel,
               threadsData, usersData, dashBoardData, globalData } = db);
        } catch (e) {
            log.error("DATABASE", `Fatal error loading database: ${e.message}`);
            console.error(e);
            process.exit(1);
        }

        // ─── 4. Load scripts (commands + events) ────────────────────
        try {
            const loadScripts = require("./loadScripts.js");
            await loadScripts(
                api, threadModel, userModel, dashBoardModel, globalModel,
                threadsData, usersData, dashBoardData, globalData, createLine
            );
        } catch (e) {
            log.error("SCRIPTS", `Error loading scripts: ${e.message}`);
            console.error(e);
        }

        // ─── 5. Custom startup code ──────────────────────────────────
        try {
            const custom = require("../custom.js");
            await custom({
                api, threadModel, userModel, dashBoardModel, globalModel,
                threadsData, usersData, dashBoardData, globalData, getText
            });
        } catch (e) {
            log.warn("CUSTOM", `Custom startup error (non-fatal): ${e.message}`);
        }

        // ─── 6. Build event handler ──────────────────────────────────
        const handler = require("../handler/handlerAction.js")(
            api, threadModel, userModel, dashBoardModel, globalModel,
            usersData, threadsData, dashBoardData, globalData
        );

        // ─── 7. Dashboard ────────────────────────────────────────────
        if (config.dashBoard?.enable) {
            try {
                require("../../dashboard/app.js");
                log.success("DASHBOARD", `Dashboard running on port ${config.dashBoard.port || 3001}`);
            } catch (e) {
                log.warn("DASHBOARD", `Could not start dashboard: ${e.message}`);
            }
        }

        // ─── 8. Start polling ────────────────────────────────────────
        log.info("LISTEN", "Starting Instagram message polling...");

        api.listenMqtt(async (err, event) => {
            if (err) {
                log.error("LISTEN", `Listener error: ${err.message || err}`);
                try {
                    const handlerErr = require("./handlerWhenListenHasError.js");
                    await handlerErr({
                        api, threadModel, userModel, dashBoardModel, globalModel,
                        threadsData, usersData, dashBoardData, globalData, error: err
                    });
                } catch (e2) {}
                return;
            }

            try {
                await handler(event);
            } catch (e) {
                log.error("HANDLER", `Unhandled error: ${e.message}`);
            }
        });

        log.success("BOT", "GoatBot Instagram is running!");
        log.info("BOT", `Commands: ${global.GoatBot.commands.size} | Events: ${global.GoatBot.eventCommands.size}`);
        log.info("BOT", `Prefix: "${config.prefix || "/"}" | Bot ID: ${botID}`);
    });
})();
