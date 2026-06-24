"use strict";

/**
 * Instagram Login Handler — GoatBot V2 Pipeline
 *
 * Login priority:
 *   1. username + password in account.txt  (recommended — survives cookie expiry)
 *   2. IG_USERNAME + IG_PASSWORD env vars   (great for cloud/Replit secrets)
 *   3. Saved session.json cookies           (auto-restored on restart if still valid)
 *   4. Raw cookie array in account.txt      (legacy — not recommended)
 */

process.stdout.write("\x1b]2;GoatBot V2 - Instagram Port by Gtajisan\x1b\x5c");

const fs   = require("fs");
const path = require("path");
const login = require("../../ig-chat-api");

const { dirAccount } = global.client;
const { config }     = global.GoatBot;
const { log, getText } = global.utils;

const SESSION_PATH = path.join(process.cwd(), "session.json");

function createLine(sectionName) {
    const width = 62;
    const pad   = Math.max(0, Math.floor((width - sectionName.length - 2) / 2));
    const line  = "─".repeat(width);
    return `\n${line}\n${" ".repeat(pad)}[ ${sectionName} ]\n${line}`;
}

function readAccountFile() {
    if (!fs.existsSync(dirAccount)) return null;
    return fs.readFileSync(dirAccount, "utf8").trim();
}

function parseCredentials(text) {
    if (!text) return null;

    const result = { username: null, password: null, cookies: null };

    const trimmed = text.trim();

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed.username && parsed.password) {
                result.username = parsed.username.trim();
                result.password = parsed.password.trim();
                return result;
            }
            if (Array.isArray(parsed)) {
                result.cookies = parsed;
                return result;
            }
        } catch (e) {}
    }

    if (trimmed.includes("=") && !trimmed.includes("sessionid") && !trimmed.startsWith("[")) {
        const lines = trimmed.split(/\r?\n/);
        const map   = {};
        for (const line of lines) {
            const eqIdx = line.indexOf("=");
            if (eqIdx === -1) continue;
            const key = line.slice(0, eqIdx).trim().toLowerCase();
            const val = line.slice(eqIdx + 1).trim();
            map[key] = val;
        }

        const user = map["username"] || map["email"] || map["user"] || map["login"];
        const pass = map["password"] || map["pass"] || map["passwd"];

        if (user && pass) {
            result.username = user;
            result.password = pass;
            return result;
        }
    }

    if (trimmed.startsWith("[") || trimmed.includes("sessionid")) {
        try {
            result.cookies = JSON.parse(trimmed);
            return result;
        } catch (e) {
            result.cookies = trimmed;
            return result;
        }
    }

    return null;
}

function loadSavedSession() {
    if (!fs.existsSync(SESSION_PATH)) return null;
    try {
        const raw = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
        if (Array.isArray(raw) && raw.length > 0) return raw;
        if (raw.appState && Array.isArray(raw.appState) && raw.appState.length > 0) return raw.appState;
        return null;
    } catch (e) {
        return null;
    }
}

function saveSession(api) {
    try {
        const appState = api.getAppState();
        if (appState && appState.length > 0) {
            fs.writeFileSync(SESSION_PATH, JSON.stringify(appState, null, 2));
        }
    } catch (e) {}
}

async function attemptLogin(loginData, loginOptions, label) {
    return new Promise((resolve, reject) => {
        login(loginData, loginOptions, (err, api) => {
            if (err) {
                log.error("LOGIN", `${label} failed: ${err.message}`);
                return reject(err);
            }
            resolve(api);
        });
    });
}

(async function main() {
    log.info("LOGIN", "──────────────────────────────────────────────────────────");
    log.info("LOGIN", "GoatBot V2 — Instagram Port  |  Login System");
    log.info("LOGIN", "──────────────────────────────────────────────────────────");

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

    const accountText = readAccountFile();
    const parsed      = parseCredentials(accountText);

    const envUser = process.env.IG_USERNAME || process.env.INSTAGRAM_USERNAME || "";
    const envPass = process.env.IG_PASSWORD || process.env.INSTAGRAM_PASSWORD || "";

    let api = null;

    if (envUser && envPass) {
        log.info("LOGIN", `Using credentials from environment variables (user: ${envUser})`);
        try {
            api = await attemptLogin({ username: envUser, password: envPass }, loginOptions, "Env var login");
        } catch (e) {
            log.warn("LOGIN", "Env var login failed — trying other methods...");
        }
    }

    if (!api && parsed?.username && parsed?.password) {
        log.info("LOGIN", `Using username/password from account.txt (user: ${parsed.username})`);
        try {
            api = await attemptLogin({ username: parsed.username, password: parsed.password }, loginOptions, "account.txt login");
        } catch (e) {
            log.warn("LOGIN", "account.txt credential login failed — trying saved session...");
        }
    }

    if (!api) {
        const savedSession = loadSavedSession();
        if (savedSession) {
            log.info("LOGIN", "Trying saved session from session.json...");
            try {
                api = await attemptLogin({ appState: savedSession }, loginOptions, "Saved session");
                log.success("LOGIN", "Restored session from session.json ✓");
            } catch (e) {
                log.warn("LOGIN", "Saved session is expired — deleting session.json...");
                try { fs.unlinkSync(SESSION_PATH); } catch (_) {}
            }
        }
    }

    if (!api && parsed?.cookies) {
        log.warn("LOGIN", "Trying legacy cookie login from account.txt (cookies expire — switch to username/password)");
        try {
            api = await attemptLogin({ appState: parsed.cookies }, loginOptions, "Legacy cookie login");
        } catch (e) {
            log.error("LOGIN", "Cookie login also failed.");
        }
    }

    if (!api) {
        log.error("LOGIN", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.error("LOGIN", "All login methods failed. Please check account.txt.");
        log.error("LOGIN", "");
        log.error("LOGIN", "Recommended format for account.txt:");
        log.error("LOGIN", "  username=your_instagram_username");
        log.error("LOGIN", "  password=your_instagram_password");
        log.error("LOGIN", "");
        log.error("LOGIN", "Or set environment variables:");
        log.error("LOGIN", "  IG_USERNAME=your_instagram_username");
        log.error("LOGIN", "  IG_PASSWORD=your_instagram_password");
        log.error("LOGIN", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        process.exit(1);
    }

    const botID = api.getCurrentUserID();
    global.GoatBot.botID  = botID;
    global.GoatBot.igApi  = api;

    log.success("LOGIN", `Bot ID: ${botID}`);

    saveSession(api);

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

    try {
        const custom = require("../custom.js");
        await custom({
            api, threadModel, userModel, dashBoardModel, globalModel,
            threadsData, usersData, dashBoardData, globalData, getText
        });
    } catch (e) {
        log.warn("CUSTOM", `Custom startup (non-fatal): ${e.message}`);
    }

    const handler = require("../handler/handlerAction.js")(
        api, threadModel, userModel, dashBoardModel, globalModel,
        usersData, threadsData, dashBoardData, globalData
    );

    if (config.dashBoard?.enable) {
        try {
            require("../../dashboard/app.js")(api);
            log.success("DASHBOARD", `Dashboard started on port ${config.dashBoard.port || 3000}`);
        } catch (e) {
            log.warn("DASHBOARD", `Could not start dashboard: ${e.message}`);
        }
    }

    log.info("LISTEN", "Starting Instagram message polling...");

    api.listenMqtt(async (err, event) => {
        if (err) {
            log.error("LISTEN", `Listener error: ${err.message || err}`);

            const is401 = err.response?.status === 401 || err.response?.status === 403;
            if (is401) {
                log.error("LISTEN", "Session expired! Deleting session.json — bot will re-login on next start.");
                try { fs.unlinkSync(SESSION_PATH); } catch (_) {}
            }

            try {
                const handlerErr = require("./handlerWhenListenHasError.js");
                await handlerErr({
                    api, threadModel, userModel, dashBoardModel, globalModel,
                    threadsData, usersData, dashBoardData, globalData, error: err
                });
            } catch (e2) {
                log.error("LISTEN", `Error in handlerWhenListenHasError: ${e2.message}`);
            }
            return;
        }

        try {
            // Use withBackoff for robust event handling
            await global.utils.withBackoff(async () => {
                await handler(event);
            });
        } catch (e) {
            log.error("HANDLER", `Unhandled error in event handler: ${e.message}`, { stack: e.stack });
        }
    });

    log.success("BOT", "GoatBot Instagram is running! 🐐");
    log.info("BOT", `Commands: ${global.GoatBot.commands.size} | Events: ${global.GoatBot.eventCommands.size}`);
    log.info("BOT", `Prefix: "${config.prefix || "/"}" | Bot ID: ${botID}`);

    setInterval(() => {
        saveSession(api);
    }, 30 * 60 * 1000);
})();
