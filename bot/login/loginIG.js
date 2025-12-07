"use strict";

/**
 * Instagram Login Handler
 * @author Gtajisan
 * @developer Gtajisan
 * @based-on NTKhang's GoatBot V2 (Team Calyx)
 */

process.stdout.write("\x1b]2;GoatBot V2 - Instagram Port by Gtajisan\x1b\x5c");

const fs = require("fs-extra");
const path = require("path");
const login = require("../../ig-chat-api");

const { dirAccount, dirConfig } = global.client;
const { config, configCommands } = global.GoatBot;

let log;
try {
    log = require('../../logger/log.js');
} catch (e) {
    log = {
        info: (tag, msg) => console.log(`[${tag}] ${msg}`),
        error: (tag, msg) => console.error(`[${tag}] ${msg}`),
        warn: (tag, msg) => console.warn(`[${tag}] ${msg}`),
        success: (tag, msg) => console.log(`[${tag}] ✓ ${msg}`)
    };
}

function parseCookiesFromText(text) {
    text = text.trim();
    
    if (text.startsWith("[")) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return parsed.map(c => ({
                    key: c.key || c.name,
                    value: c.value,
                    domain: c.domain || "instagram.com",
                    path: c.path || "/",
                    hostOnly: c.hostOnly || false,
                    creation: new Date().toISOString(),
                    lastAccessed: new Date().toISOString()
                })).filter(c => c.key && c.value);
            }
        } catch (e) {}
    }
    
    if (text.includes("=") && text.includes(";")) {
        return text.split(";").map(c => {
            const [key, ...valueParts] = c.trim().split("=");
            return {
                key: key?.trim(),
                value: valueParts.join("=")?.trim(),
                domain: "instagram.com",
                path: "/",
                hostOnly: false,
                creation: new Date().toISOString(),
                lastAccessed: new Date().toISOString()
            };
        }).filter(c => c.key && c.value);
    }
    
    if (text.includes("\t")) {
        const lines = text.split("\n").filter(line => !line.trim().startsWith("#") && line.trim());
        return lines.map(line => {
            const fields = line.split("\t");
            if (fields.length >= 7) {
                return {
                    key: fields[5],
                    value: fields[6],
                    domain: fields[0],
                    path: fields[2],
                    hostOnly: fields[1] === "TRUE",
                    creation: new Date().toISOString(),
                    lastAccessed: new Date().toISOString()
                };
            }
            return null;
        }).filter(c => c && c.key && c.value);
    }
    
    return [];
}

async function getAppState() {
    if (!fs.existsSync(dirAccount)) {
        log.error("LOGIN", `File not found: ${dirAccount}`);
        log.info("LOGIN", "Please create account.txt with your Instagram cookies");
        log.info("LOGIN", "Format: JSON array of cookies or cookie string (sessionid=xxx; ds_user_id=xxx; csrftoken=xxx;)");
        process.exit(1);
    }
    
    const accountText = fs.readFileSync(dirAccount, "utf8").trim();
    
    if (!accountText) {
        log.error("LOGIN", "account.txt is empty");
        log.info("LOGIN", "Please add your Instagram cookies to account.txt");
        log.info("LOGIN", "Required cookies: sessionid, ds_user_id, csrftoken");
        process.exit(1);
    }
    
    const cookies = parseCookiesFromText(accountText);
    
    if (cookies.length === 0) {
        log.error("LOGIN", "Could not parse cookies from account.txt");
        process.exit(1);
    }
    
    const hasSessionId = cookies.some(c => c.key === "sessionid");
    const hasDsUserId = cookies.some(c => c.key === "ds_user_id");
    
    if (!hasSessionId || !hasDsUserId) {
        log.error("LOGIN", "Missing required cookies");
        log.info("LOGIN", `sessionid: ${hasSessionId ? "✓" : "✗"}`);
        log.info("LOGIN", `ds_user_id: ${hasDsUserId ? "✓" : "✗"}`);
        log.info("LOGIN", "Please ensure your Instagram cookies include both sessionid and ds_user_id");
        process.exit(1);
    }
    
    return cookies;
}

async function startBot() {
    log.info("LOGIN", "Getting Instagram appState from account.txt...");
    
    const appState = await getAppState();
    
    log.info("LOGIN", `Found ${appState.length} cookies`);
    
    const loginOptions = {
        listenEvents: config.optionsFca?.listenEvents ?? true,
        selfListen: config.optionsFca?.selfListen ?? false,
        autoMarkDelivery: config.optionsFca?.autoMarkDelivery ?? true,
        autoMarkRead: config.optionsFca?.autoMarkRead ?? false,
        autoReconnect: config.optionsFca?.autoReconnect ?? true,
        logLevel: config.optionsFca?.logLevel ?? "info",
        forceLogin: config.optionsFca?.forceLogin ?? true,
        userAgent: config.instagramAccount?.userAgent || "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    };
    
    log.info("LOGIN", "Logging into Instagram...");
    
    login({ appState }, loginOptions, async (err, api) => {
        if (err) {
            log.error("LOGIN", `Failed to login: ${err.message}`);
            log.info("LOGIN", "Please check your Instagram cookies in account.txt");
            process.exit(1);
        }
        
        const botID = api.getCurrentUserID();
        global.GoatBot.igApi = api;
        global.GoatBot.botID = botID;
        
        log.success("LOGIN", `Logged in successfully! Bot ID: ${botID}`);
        
        fs.writeFileSync(
            path.join(__dirname, "../../session.json"),
            JSON.stringify(api.getAppState(), null, 2)
        );
        log.info("SESSION", "Session saved to session.json");
        
        try {
            await loadDatabase();
        } catch (e) {
            log.warn("DATABASE", `Database load warning: ${e.message}`);
        }
        
        await loadCommands();
        await loadEvents();
        
        startDashboard();
        
        log.info("LISTEN", "Starting message listener...");
        
        api.listenMqtt((err, event) => {
            if (err) {
                log.error("LISTEN", `Error: ${err.message}`);
                return;
            }
            
            handleMessage(api, event);
        });
        
        log.success("BOT", "Instagram GoatBot is now running!");
        log.info("BOT", `Prefix: ${config.prefix || "/"}`);
        log.info("BOT", `Commands: ${global.GoatBot.commands.size}`);
        log.info("BOT", `Events: ${global.GoatBot.eventCommands.size}`);
    });
}

async function loadDatabase() {
    const dbPath = path.join(__dirname, "../../database");
    
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
    }
    
    const usersFile = path.join(dbPath, "users.json");
    const threadsFile = path.join(dbPath, "threads.json");
    const globalFile = path.join(dbPath, "global.json");
    
    try {
        if (fs.existsSync(usersFile)) {
            global.db.allUserData = JSON.parse(fs.readFileSync(usersFile, "utf8"));
        }
    } catch (e) {
        global.db.allUserData = [];
    }
    
    try {
        if (fs.existsSync(threadsFile)) {
            global.db.allThreadData = JSON.parse(fs.readFileSync(threadsFile, "utf8"));
        }
    } catch (e) {
        global.db.allThreadData = [];
    }
    
    try {
        if (fs.existsSync(globalFile)) {
            global.db.allGlobalData = JSON.parse(fs.readFileSync(globalFile, "utf8"));
        }
    } catch (e) {
        global.db.allGlobalData = [];
    }
    
    global.db.usersData = {
        get: async (userID) => {
            let user = global.db.allUserData.find(u => u.userID === userID?.toString());
            if (!user) {
                user = { userID: userID?.toString(), data: {}, money: 0, exp: 0, name: "" };
                global.db.allUserData.push(user);
            }
            return user;
        },
        set: async (userID, data) => {
            let user = global.db.allUserData.find(u => u.userID === userID?.toString());
            if (!user) {
                user = { userID: userID?.toString(), data: {}, money: 0, exp: 0, name: "" };
                global.db.allUserData.push(user);
            }
            Object.assign(user, data);
            saveDatabase();
            return user;
        },
        getAll: async () => global.db.allUserData,
        create: async (userID) => {
            const user = { userID: userID?.toString(), data: {}, money: 0, exp: 0, name: "" };
            global.db.allUserData.push(user);
            saveDatabase();
            return user;
        }
    };
    
    global.db.threadsData = {
        get: async (threadID) => {
            let thread = global.db.allThreadData.find(t => t.threadID === threadID?.toString());
            if (!thread) {
                thread = { threadID: threadID?.toString(), data: {}, adminIDs: [], members: [], settings: {} };
                global.db.allThreadData.push(thread);
            }
            return thread;
        },
        set: async (threadID, data) => {
            let thread = global.db.allThreadData.find(t => t.threadID === threadID?.toString());
            if (!thread) {
                thread = { threadID: threadID?.toString(), data: {}, adminIDs: [], members: [], settings: {} };
                global.db.allThreadData.push(thread);
            }
            Object.assign(thread, data);
            saveDatabase();
            return thread;
        },
        getAll: async () => global.db.allThreadData,
        create: async (threadID) => {
            const thread = { threadID: threadID?.toString(), data: {}, adminIDs: [], members: [], settings: {} };
            global.db.allThreadData.push(thread);
            saveDatabase();
            return thread;
        }
    };
    
    global.db.globalData = {
        get: async (key, defaultValue) => {
            const data = global.db.allGlobalData.find(d => d.key === key);
            return data ? data.value : defaultValue;
        },
        set: async (key, value) => {
            let data = global.db.allGlobalData.find(d => d.key === key);
            if (data) {
                data.value = value;
            } else {
                global.db.allGlobalData.push({ key, value });
            }
            saveDatabase();
        }
    };
    
    log.success("DATABASE", "Database loaded successfully");
}

function saveDatabase() {
    const dbPath = path.join(__dirname, "../../database");
    
    try {
        fs.writeFileSync(path.join(dbPath, "users.json"), JSON.stringify(global.db.allUserData, null, 2));
        fs.writeFileSync(path.join(dbPath, "threads.json"), JSON.stringify(global.db.allThreadData, null, 2));
        fs.writeFileSync(path.join(dbPath, "global.json"), JSON.stringify(global.db.allGlobalData, null, 2));
    } catch (e) {
        log.warn("DATABASE", `Save warning: ${e.message}`);
    }
}

async function loadCommands() {
    const cmdPath = path.join(__dirname, "../../scripts/cmds");
    
    if (!fs.existsSync(cmdPath)) {
        log.warn("COMMANDS", "Commands directory not found");
        return;
    }
    
    const files = fs.readdirSync(cmdPath).filter(f => f.endsWith(".js"));
    
    for (const file of files) {
        try {
            delete require.cache[require.resolve(path.join(cmdPath, file))];
            const cmd = require(path.join(cmdPath, file));
            
            const name = cmd.config?.name || file.replace(".js", "");
            
            global.GoatBot.commands.set(name, cmd);
            
            if (cmd.config?.aliases) {
                for (const alias of cmd.config.aliases) {
                    global.GoatBot.aliases.set(alias, name);
                }
            }
            
            if (cmd.onChat) {
                global.GoatBot.onChat.push({ commandName: name, onChat: cmd.onChat });
            }
            
            if (cmd.onReply) {
                global.GoatBot.onReply.set(name, cmd);
            }
            
            log.success("COMMAND", `Loaded: ${name}`);
        } catch (err) {
            log.error("COMMAND", `Failed to load ${file}: ${err.message}`);
        }
    }
}

async function loadEvents() {
    const evtPath = path.join(__dirname, "../../scripts/events");
    
    if (!fs.existsSync(evtPath)) {
        return;
    }
    
    const files = fs.readdirSync(evtPath).filter(f => f.endsWith(".js"));
    
    for (const file of files) {
        try {
            delete require.cache[require.resolve(path.join(evtPath, file))];
            const evt = require(path.join(evtPath, file));
            
            const name = evt.config?.name || file.replace(".js", "");
            global.GoatBot.eventCommands.set(name, evt);
            
            if (evt.onEvent) {
                global.GoatBot.onEvent.push({ eventName: name, onEvent: evt.onEvent });
            }
            
            log.success("EVENT", `Loaded: ${name}`);
        } catch (err) {
            log.error("EVENT", `Failed to load ${file}: ${err.message}`);
        }
    }
}

function startDashboard() {
    if (!config.dashBoard?.enable) return;
    
    try {
        const dashboardPath = path.join(__dirname, "../../dashboard/server.js");
        if (fs.existsSync(dashboardPath)) {
            require(dashboardPath);
            log.success("DASHBOARD", `Dashboard started on port ${config.dashBoard.port || 3001}`);
        }
    } catch (e) {
        log.warn("DASHBOARD", `Could not start dashboard: ${e.message}`);
    }
}

async function handleMessage(api, event) {
    if (!event || !event.body) return;
    
    const { body, senderID, threadID, messageID } = event;
    const prefix = config.prefix || "/";
    
    const isAdmin = config.adminBot?.includes(senderID?.toString());
    
    for (const { commandName, onChat } of global.GoatBot.onChat) {
        try {
            await onChat({
                api,
                event,
                message: createMessage(api, event),
                usersData: global.db.usersData,
                threadsData: global.db.threadsData,
                globalData: global.db.globalData,
                getLang: (key) => key
            });
        } catch (e) {}
    }
    
    for (const { eventName, onEvent } of global.GoatBot.onEvent) {
        try {
            await onEvent({
                api,
                event,
                message: createMessage(api, event),
                usersData: global.db.usersData,
                threadsData: global.db.threadsData,
                globalData: global.db.globalData,
                getLang: (key) => key
            });
        } catch (e) {}
    }
    
    if (!body.startsWith(prefix)) return;
    
    const args = body.slice(prefix.length).trim().split(/ +/);
    let commandName = args.shift()?.toLowerCase();
    
    if (global.GoatBot.aliases.has(commandName)) {
        commandName = global.GoatBot.aliases.get(commandName);
    }
    
    const command = global.GoatBot.commands.get(commandName);
    if (!command) return;
    
    const cmdConfig = command.config || {};
    
    if (cmdConfig.role && cmdConfig.role > 0 && !isAdmin) {
        api.sendMessage(threadID, "⚠️ You don't have permission to use this command.");
        return;
    }
    
    const message = createMessage(api, event);
    
    try {
        if (command.onStart) {
            await command.onStart({
                api,
                event,
                args,
                message,
                commandName,
                usersData: global.db.usersData,
                threadsData: global.db.threadsData,
                globalData: global.db.globalData,
                prefix,
                role: isAdmin ? 2 : 0,
                getLang: (key) => key,
                commandConfig: cmdConfig
            });
        } else if (command.run) {
            await command.run({
                api,
                event,
                args,
                message,
                commandName,
                usersData: global.db.usersData,
                threadsData: global.db.threadsData,
                globalData: global.db.globalData,
                prefix,
                role: isAdmin ? 2 : 0,
                getLang: (key) => key
            });
        }
        
        log.info("COMMAND", `${commandName} executed by ${senderID} in ${threadID}`);
    } catch (err) {
        log.error("COMMAND", `Error in ${commandName}: ${err.message}`);
        message.reply(`❌ Error: ${err.message}`);
    }
}

function createMessage(api, event) {
    const { threadID, messageID } = event;
    
    return {
        send: (msg, callback) => api.sendMessage(msg, threadID, messageID, callback),
        reply: (msg, callback) => api.sendMessage(msg, threadID, messageID, callback),
        react: (emoji) => api.setMessageReaction(emoji, messageID, threadID),
        unsend: (msgID) => api.unsendMessage(msgID || messageID, threadID),
        err: (msg) => api.sendMessage(`❌ Error: ${msg}`, threadID),
        error: (msg) => api.sendMessage(`❌ Error: ${msg}`, threadID),
        success: (msg) => api.sendMessage(`✅ ${msg}`, threadID)
    };
}

startBot();
