"use strict";

const fs = require("fs");
const path = require("path");
const login = require("../../ig-chat-api");

const { dirAccount } = global.client;
const { config } = global.GoatBot;
const { log } = global.utils;

const SESSION_PATH = path.join(process.cwd(), "session.json");

function readAccountFile() {
    if (!fs.existsSync(dirAccount)) return null;
    return fs.readFileSync(dirAccount, "utf8").trim();
}

function parseCredentials(text) {
    if (!text) return null;
    const trimmed = text.trim();

    if (trimmed.startsWith("[") || trimmed.includes("sessionid")) {
        return { cookies: trimmed };
    }

    if (trimmed.includes("=")) {
        const lines = trimmed.split(/\r?\n/);
        const map = {};
        for (const line of lines) {
            const eqIdx = line.indexOf("=");
            if (eqIdx === -1) continue;
            map[line.slice(0, eqIdx).trim().toLowerCase()] = line.slice(eqIdx + 1).trim();
        }
        const user = map["username"] || map["email"];
        const pass = map["password"] || map["pass"];
        if (user && pass) return { username: user, password: pass };
    }

    return null;
}

async function attemptLogin(loginData, options, label) {
    return new Promise((resolve, reject) => {
        login(loginData, options, (err, api) => {
            if (err) {
                log.error("LOGIN", `${label} failed: ${err.message}`);
                return reject(err);
            }
            resolve(api);
        });
    });
}

(async function main() {
    log.info("LOGIN", "Starting Instagram Login...");

    const loginOptions = {
        userAgent: config.instagramAccount?.userAgent,
        ...config.optionsFca
    };

    const accountText = readAccountFile();
    const parsed = parseCredentials(accountText);

    const envUser = process.env.IG_USERNAME || process.env.ACCOUNT_EMAIL;
    const envPass = process.env.IG_PASSWORD || process.env.ACCOUNT_PASSWORD;

    let api = null;

    if (envUser && envPass) {
        try {
            api = await attemptLogin({ username: envUser, password: envPass }, loginOptions, "Env Login");
        } catch (e) {}
    }

    if (!api && parsed) {
        if (parsed.cookies) {
            try {
                api = await attemptLogin({ appState: parsed.cookies }, loginOptions, "Cookie Login");
            } catch (e) {}
        } else if (parsed.username && parsed.password) {
            try {
                api = await attemptLogin({ username: parsed.username, password: parsed.password }, loginOptions, "Credentials Login");
            } catch (e) {}
        }
    }

    if (!api && fs.existsSync(SESSION_PATH)) {
        try {
            const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
            api = await attemptLogin({ appState: session }, loginOptions, "Session Login");
        } catch (e) {
            try { fs.unlinkSync(SESSION_PATH); } catch (err) {}
        }
    }

    if (!api) {
        log.error("LOGIN", "All login methods failed. Check your credentials.");
        process.exit(1);
    }

    const botID = api.getCurrentUserID();
    global.GoatBot.botID = botID;
    global.GoatBot.igApi = api;
    log.success("LOGIN", `Logged in as ${botID}`);

    try {
        const appState = api.getAppState();
        if (appState) fs.writeFileSync(SESSION_PATH, JSON.stringify(appState, null, 2));
    } catch (e) {}

    const loadData = require("./loadData.js");
    const db = await loadData(api, (section) => `\n--- ${section} ---\n`);
    const { threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData } = db;

    const loadScripts = require("./loadScripts.js");
    await loadScripts(api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, (s) => `\n--- ${s} ---\n`);

    const handler = require("../handler/handlerAction.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

    api.listenMqtt(async (err, event) => {
        if (err) {
            log.error("LISTEN", `Listener error: ${err.message}`);
            return;
        }
        if (!event) return;
        try {
            await global.utils.withBackoff(async () => {
                await handler(event);
            });
        } catch (e) {
            log.error("HANDLER", `Error: ${e.message}`, { stack: e.stack });
        }
    });

    log.success("BOT", "GoatBot Instagram is running! 🐐");
})();
