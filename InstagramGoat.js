
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
let config = {};

try {
    config = require(dirConfig);
} catch (err) {
    log.error("CONFIG", "config.json not found or invalid");
    config = { adminBot: [], prefix: "!", language: "en" };
}

global.db = {
    allThreadData: [],
    allUserData: [],
    allGlobalData: {}
};

const commands = new Map();
const events = new Map();

async function loadCommands() {
    const cmdPath = path.join(__dirname, "scripts", "cmds");
    const files = fs.readdirSync(cmdPath).filter(f => f.endsWith(".js"));
    
    for (const file of files) {
        try {
            delete require.cache[require.resolve(path.join(cmdPath, file))];
            const cmd = require(path.join(cmdPath, file));
            const name = file.replace(".js", "");
            commands.set(name, cmd);
            log.success("COMMAND", `Loaded ${name}`);
        } catch (err) {
            log.error("COMMAND", `Failed to load ${file}: ${err.message}`);
        }
    }
}

async function loadEvents() {
    const evtPath = path.join(__dirname, "scripts", "events");
    const files = fs.readdirSync(evtPath).filter(f => f.endsWith(".js"));
    
    for (const file of files) {
        try {
            delete require.cache[require.resolve(path.join(evtPath, file))];
            const evt = require(path.join(evtPath, file));
            const name = file.replace(".js", "");
            events.set(name, evt);
            log.success("EVENT", `Loaded ${name}`);
        } catch (err) {
            log.error("EVENT", `Failed to load ${file}: ${err.message}`);
        }
    }
}

function createMessageAPI(api, event) {
    return {
        send: (msg, callback) => api.sendMessage(event.threadID, msg, callback),
        reply: (msg, callback) => api.sendMessage(event.threadID, msg, callback),
        react: (emoji) => api.setMessageReaction && api.setMessageReaction(event.messageID, emoji),
        unsend: (msgID) => api.unsendMessage && api.unsendMessage(msgID || event.messageID),
        err: (msg) => api.sendMessage(event.threadID, `❌ Error: ${msg}`)
    };
}

async function handleCommand(api, event) {
    const { body, senderID, threadID } = event;
    if (!body || !body.startsWith(config.prefix || "!")) return;
    
    const args = body.slice((config.prefix || "!").length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = commands.get(commandName);
    if (!command) return;
    
    const message = createMessageAPI(api, event);
    
    const usersData = {
        get: async (userID) => {
            let user = global.db.allUserData.find(u => u.userID === userID);
            if (!user) {
                user = { userID, data: {}, money: 0 };
                global.db.allUserData.push(user);
            }
            return user;
        },
        set: async (userID, data) => {
            const user = await usersData.get(userID);
            Object.assign(user.data, data);
            return user;
        },
        create: async (userID) => {
            const user = { userID, data: {}, money: 0 };
            global.db.allUserData.push(user);
            return user;
        }
    };
    
    const threadsData = {
        get: async (threadID) => {
            let thread = global.db.allThreadData.find(t => t.threadID === threadID);
            if (!thread) {
                thread = { threadID, data: {}, adminIDs: [] };
                global.db.allThreadData.push(thread);
            }
            return thread;
        },
        set: async (threadID, data) => {
            const thread = await threadsData.get(threadID);
            Object.assign(thread.data, data);
            return thread;
        },
        create: async (threadID) => {
            const thread = { threadID, data: {}, adminIDs: [] };
            global.db.allThreadData.push(thread);
            return thread;
        }
    };
    
    try {
        if (command.onStart) {
            await command.onStart({
                api,
                event,
                args,
                message,
                commandName,
                usersData,
                threadsData,
                prefix: config.prefix || "!",
                role: config.adminBot?.includes(senderID) ? 2 : 0,
                getLang: (key) => key
            });
        }
        
        log.info("COMMAND", `${commandName} executed by ${senderID}`);
    } catch (err) {
        log.error("COMMAND", `Error in ${commandName}: ${err.message}`);
        message.reply(`❌ Error: ${err.message}`);
    }
}

async function handleEvent(api, event) {
    for (const [name, evt] of events) {
        try {
            if (evt.onStart) {
                await evt.onStart({ api, event });
            }
        } catch (err) {
            log.error("EVENT", `Error in ${name}: ${err.message}`);
        }
    }
}

async function startBot() {
    log.info("STARTUP", "Starting Instagram GoatBot...");
    
    await loadCommands();
    await loadEvents();
    
    const login = require("./ig-chat-api");
    
    const loginData = {
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || process.env.IG_ACCESS_TOKEN,
        igUserID: process.env.INSTAGRAM_PAGE_ID || process.env.IG_USER_ID,
        verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN || process.env.IG_VERIFY_TOKEN || "goatbot_ig_verify",
        webhookPort: process.env.PORT || 5000
    };
    
    if (!loginData.accessToken || !loginData.igUserID) {
        log.error("LOGIN", "Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_PAGE_ID in environment");
        log.info("LOGIN", "Set these in .env file or Secrets tab");
        log.info("SETUP", "Follow Instagram Graph API setup guide:");
        log.info("SETUP", "1. Create Facebook App with Instagram permissions");
        log.info("SETUP", "2. Get Page Access Token with instagram_manage_messages scope");
        log.info("SETUP", "3. Configure webhook to https://your-domain/webhook");
        process.exit(1);
    }
    
    try {
        const api = await new Promise((resolve, reject) => {
            login(loginData, (err, apiInstance) => {
                if (err) reject(err);
                else resolve(apiInstance);
            });
        });
        
        log.success("LOGIN", "Connected to Instagram API");
        log.info("BOT", `Bot ID: ${loginData.igUserID}`);
        log.info("BOT", `Prefix: ${config.prefix || "!"}`);
        log.info("BOT", `Commands loaded: ${commands.size}`);
        log.info("BOT", `Events loaded: ${events.size}`);
        
        api.on('message', async (event) => {
            try {
                log.info("MESSAGE", `From ${event.senderID}: ${event.body}`);
                
                await handleEvent(api, event);
                await handleCommand(api, event);
            } catch (err) {
                log.error("HANDLER", err.message);
            }
        });
        
        api.listen();
        log.success("LISTEN", "Bot is now listening for Instagram messages");
        log.info("WEBHOOK", "Make sure your webhook is configured at Facebook Developer Console");
        
    } catch (err) {
        log.error("LOGIN", `Failed to start: ${err.message}`);
        process.exit(1);
    }
}

startBot();
