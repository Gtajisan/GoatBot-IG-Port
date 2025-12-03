/**
 * InstagramGoat.js - GoatBot V2 for Instagram
 * 
 * This is the Instagram version of GoatBot using ig-chat-api
 * Drop-in replacement for the original Goat.js that works with Instagram
 * 
 * @author GoatBot-Instagram Migration
 * @based-on NTKhang's GoatBot V2
 */

process.on("unhandledRejection", error => console.log(error));
process.on("uncaughtException", error => console.log(error));

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0;

const log = {
    info: (head, msg) => console.log(`[${head}] ${msg}`),
    error: (head, msg) => console.error(`[${head}] ${msg}`),
    warn: (head, msg) => console.warn(`[${head}] ${msg}`),
    success: (head, msg) => console.log(`[${head}] ✓ ${msg}`)
};

const dirConfig = path.normalize(`${__dirname}/config.json`);
const dirConfigCommands = path.normalize(`${__dirname}/configCommands.json`);

let config, configCommands;

try {
    config = require(dirConfig);
    configCommands = require(dirConfigCommands);
} catch (err) {
    log.error("CONFIG", `Failed to load config: ${err.message}`);
    process.exit(1);
}

global.GoatBot = {
    startTime: Date.now() - process.uptime() * 1000,
    commands: new Map(),
    eventCommands: new Map(),
    commandFilesPath: [],
    eventCommandsFilesPath: [],
    aliases: new Map(),
    onFirstChat: [],
    onChat: [],
    onEvent: [],
    onReply: new Map(),
    onReaction: new Map(),
    onAnyEvent: [],
    config,
    configCommands,
    envCommands: {},
    envEvents: {},
    envGlobal: {},
    reLoginBot: function () { },
    Listening: null,
    oldListening: [],
    callbackListenTime: {},
    storage5Message: [],
    fcaApi: null,
    botID: null
};

global.db = {
    allThreadData: [],
    allUserData: [],
    allDashBoardData: [],
    allGlobalData: [],
    threadModel: null,
    userModel: null,
    dashboardModel: null,
    globalModel: null,
    threadsData: null,
    usersData: null,
    dashBoardData: null,
    globalData: null,
    receivedTheFirstMessage: {}
};

global.client = {
    dirConfig,
    dirConfigCommands,
    countDown: {},
    cache: {},
    database: {
        creatingThreadData: [],
        creatingUserData: [],
        creatingDashBoardData: [],
        creatingGlobalData: []
    },
    commandBanned: configCommands.commandBanned || []
};

global.temp = {
    createThreadData: [],
    createUserData: [],
    createThreadDataError: [],
    filesOfGoogleDrive: { arraybuffer: {}, stream: {}, fileNames: {} },
    contentScripts: { cmds: {}, events: {} }
};

let utils;
try {
    utils = require("./utils.js");
    global.utils = utils;
} catch (err) {
    global.utils = {
        log,
        getTime: (format) => new Date().toISOString(),
        getText: (lang, key, ...args) => key
    };
}

global.GoatBot.envGlobal = global.GoatBot.configCommands.envGlobal || {};
global.GoatBot.envCommands = global.GoatBot.configCommands.envCommands || {};
global.GoatBot.envEvents = global.GoatBot.configCommands.envEvents || {};

console.log("\n");
console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║                                                          ║");
console.log("║     ██████╗  ██████╗  █████╗ ████████╗██████╗  ██████╗ ████████╗  ║");
console.log("║    ██╔════╝ ██╔═══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██╗╚══██╔══╝  ║");
console.log("║    ██║  ███╗██║   ██║███████║   ██║   ██████╔╝██║   ██║   ██║     ║");
console.log("║    ██║   ██║██║   ██║██╔══██║   ██║   ██╔══██╗██║   ██║   ██║     ║");
console.log("║    ╚██████╔╝╚██████╔╝██║  ██║   ██║   ██████╔╝╚██████╔╝   ██║     ║");
console.log("║     ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═════╝  ╚═════╝    ╚═╝     ║");
console.log("║                                                          ║");
console.log("║              INSTAGRAM EDITION                           ║");
console.log("║                                                          ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log("\n");

async function loadCommands() {
    const commandsPath = path.join(__dirname, "scripts", "cmds");
    
    if (!fs.existsSync(commandsPath)) {
        log.warn("COMMANDS", "No commands folder found");
        return;
    }
    
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
    
    for (const file of files) {
        try {
            const command = require(path.join(commandsPath, file));
            if (command.config && command.config.name) {
                global.GoatBot.commands.set(command.config.name, command);
                
                if (command.config.aliases) {
                    for (const alias of command.config.aliases) {
                        global.GoatBot.aliases.set(alias, command.config.name);
                    }
                }
                
                if (command.onChat) {
                    global.GoatBot.onChat.push(command.config.name);
                }
                
                log.success("COMMANDS", `Loaded: ${command.config.name}`);
            }
        } catch (err) {
            log.error("COMMANDS", `Failed to load ${file}: ${err.message}`);
        }
    }
    
    log.info("COMMANDS", `Loaded ${global.GoatBot.commands.size} commands`);
}

async function loadEvents() {
    const eventsPath = path.join(__dirname, "scripts", "events");
    
    if (!fs.existsSync(eventsPath)) {
        log.warn("EVENTS", "No events folder found");
        return;
    }
    
    const files = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
    
    for (const file of files) {
        try {
            const event = require(path.join(eventsPath, file));
            if (event.config && event.config.name) {
                global.GoatBot.eventCommands.set(event.config.name, event);
                
                if (event.onEvent) {
                    global.GoatBot.onEvent.push(event.config.name);
                }
                
                log.success("EVENTS", `Loaded: ${event.config.name}`);
            }
        } catch (err) {
            log.error("EVENTS", `Failed to load ${file}: ${err.message}`);
        }
    }
    
    log.info("EVENTS", `Loaded ${global.GoatBot.eventCommands.size} events`);
}

function getPrefix(threadID) {
    return global.GoatBot.config.prefix || "!";
}

function handleMessage(api, event) {
    const { body, senderID, threadID, messageID } = event;
    const prefix = getPrefix(threadID);
    
    if (!body || !body.startsWith(prefix)) {
        return;
    }
    
    const args = body.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    let command = global.GoatBot.commands.get(commandName) || 
                  global.GoatBot.commands.get(global.GoatBot.aliases.get(commandName));
    
    if (!command) {
        api.sendMessage(`Command "${commandName}" not found. Use ${prefix}help for available commands.`, threadID);
        return;
    }
    
    const message = {
        reply: (msg, callback) => api.sendMessage(msg, threadID, callback, messageID),
        send: (msg, callback) => api.sendMessage(msg, threadID, callback),
        unsend: (msgID, callback) => api.unsendMessage(msgID, callback),
        reaction: (emoji, msgID, callback) => api.setMessageReaction(emoji, msgID, callback)
    };
    
    const usersData = {
        get: async (userID) => {
            const user = global.db.allUserData.find(u => u.userID == userID);
            return user || { userID, name: "Instagram User", data: {} };
        },
        create: async (userID) => {
            const user = { userID, name: "Instagram User", data: {} };
            global.db.allUserData.push(user);
            return user;
        }
    };
    
    const threadsData = {
        get: async (threadID) => {
            const thread = global.db.allThreadData.find(t => t.threadID == threadID);
            return thread || { threadID, data: {}, adminIDs: [] };
        },
        create: async (threadID) => {
            const thread = { threadID, data: {}, adminIDs: [] };
            global.db.allThreadData.push(thread);
            return thread;
        }
    };
    
    try {
        if (command.onStart) {
            command.onStart({
                api,
                event,
                args,
                message,
                commandName,
                usersData,
                threadsData,
                prefix,
                role: config.adminBot?.includes(senderID) ? 2 : 0,
                getLang: (key) => key
            });
        }
        
        log.info("COMMAND", `${commandName} executed by ${senderID}`);
    } catch (err) {
        log.error("COMMAND", `Error in ${commandName}: ${err.message}`);
        message.reply(`Error: ${err.message}`);
    }
}

async function startBot() {
    log.info("STARTUP", "Starting Instagram GoatBot...");
    
    await loadCommands();
    await loadEvents();
    
    const login = require("./ig-chat-api");
    
    const loginData = {
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
        igUserID: process.env.INSTAGRAM_PAGE_ID,
        verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN || "goatbot_ig_verify"
    };
    
    login(loginData, { webhookPort: 5000 }, (err, api) => {
        if (err) {
            log.error("LOGIN", `Failed to login: ${err.message}`);
            log.info("LOGIN", "Make sure INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_PAGE_ID are set correctly");
            return;
        }
        
        log.success("LOGIN", "Successfully logged in to Instagram!");
        
        global.GoatBot.fcaApi = api;
        global.GoatBot.botID = api.getCurrentUserID();
        
        log.info("BOT", `Bot ID: ${global.GoatBot.botID}`);
        log.info("BOT", `Prefix: ${config.prefix || "!"}`);
        log.info("BOT", `Commands loaded: ${global.GoatBot.commands.size}`);
        
        api.listen((err, event) => {
            if (err) {
                log.error("LISTEN", `Error: ${err.message || err}`);
                return;
            }
            
            if (event.type === "message") {
                log.info("MESSAGE", `From ${event.senderID}: ${event.body?.substring(0, 50) || "[attachment]"}`);
                handleMessage(api, event);
            }
        });
        
        log.success("BOT", "Bot is now listening for Instagram messages!");
        log.info("BOT", "Configure your Facebook App webhook to: https://YOUR_DOMAIN/webhook");
    });
}

startBot().catch(err => {
    log.error("STARTUP", `Fatal error: ${err.message}`);
    console.error(err);
});
