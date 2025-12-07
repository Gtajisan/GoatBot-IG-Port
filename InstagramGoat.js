/**
 * InstagramGoat.js - GoatBot V2 for Instagram
 * 
 * This is the Instagram port of GoatBot V2
 * Drop-in replacement for the original Goat.js that works with Instagram
 * 
 * @author Gtajisan
 * @developer Gtajisan
 * @based-on NTKhang's GoatBot V2 (Team Calyx)
 * @credit DongDev, NTKhang, Team Calyx
 */

process.on('unhandledRejection', error => console.log(error));
process.on('uncaughtException', error => console.log(error));

const axios = require("axios");
const fs = require("fs-extra");
const { execSync } = require('child_process');
const path = require("path");

process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0;

function validJSON(pathDir) {
    try {
        if (!fs.existsSync(pathDir))
            throw new Error(`File "${pathDir}" not found`);
        JSON.parse(fs.readFileSync(pathDir, 'utf-8'));
        return true;
    }
    catch (err) {
        throw new Error(err.message);
    }
}

const { NODE_ENV } = process.env;
const dirConfig = path.normalize(`${__dirname}/config.json`);
const dirConfigCommands = path.normalize(`${__dirname}/configCommands.json`);
const dirAccount = path.normalize(`${__dirname}/account.txt`);

let log;
try {
    log = require('./logger/log.js');
} catch (e) {
    log = {
        info: (tag, msg) => console.log(`[${tag}] ${msg}`),
        error: (tag, msg) => console.error(`[${tag}] ${msg}`),
        warn: (tag, msg) => console.warn(`[${tag}] ${msg}`),
        success: (tag, msg) => console.log(`[${tag}] ✓ ${msg}`)
    };
}

for (const pathDir of [dirConfig, dirConfigCommands]) {
    try {
        validJSON(pathDir);
    }
    catch (err) {
        log.error("CONFIG", `Invalid JSON file "${pathDir.replace(__dirname, "")}":\n${err.message}`);
        process.exit(0);
    }
}

const config = require(dirConfig);
if (config.whiteListMode?.whiteListIds && Array.isArray(config.whiteListMode.whiteListIds))
    config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.map(id => id.toString());
const configCommands = require(dirConfigCommands);

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
    igApi: null,
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
    dirAccount,
    countDown: {},
    cache: {},
    database: {
        creatingThreadData: [],
        creatingUserData: [],
        creatingDashBoardData: [],
        creatingGlobalData: []
    },
    commandBanned: configCommands.commandBanned
};

let utils;
try {
    utils = require("./utils.js");
} catch (e) {
    utils = {
        log: log,
        getText: (file, key, ...args) => key,
        convertTime: (ms) => `${Math.floor(ms / 1000)}s`,
        colors: { gray: s => s, green: s => s },
        randomString: (len) => Math.random().toString(36).substring(2, 2 + len)
    };
}
global.utils = utils;

global.temp = {
    createThreadData: [],
    createUserData: [],
    createThreadDataError: [],
    filesOfGoogleDrive: {
        arraybuffer: {},
        stream: {},
        fileNames: {}
    },
    contentScripts: {
        cmds: {},
        events: {}
    }
};

const watchAndReloadConfig = (dir, type, prop, logName) => {
    let lastModified = fs.statSync(dir).mtimeMs;
    let isFirstModified = true;

    fs.watch(dir, (eventType) => {
        if (eventType === type) {
            setTimeout(() => {
                try {
                    if (isFirstModified) {
                        isFirstModified = false;
                        return;
                    }
                    if (lastModified === fs.statSync(dir).mtimeMs) return;
                    global.GoatBot[prop] = JSON.parse(fs.readFileSync(dir, 'utf-8'));
                    log.success(logName, `Reloaded ${dir.replace(process.cwd(), "")}`);
                }
                catch (err) {
                    log.warn(logName, `Can't reload ${dir.replace(process.cwd(), "")}`);
                }
                finally {
                    lastModified = fs.statSync(dir).mtimeMs;
                }
            }, 200);
        }
    });
};

watchAndReloadConfig(dirConfigCommands, 'change', 'configCommands', 'CONFIG COMMANDS');
watchAndReloadConfig(dirConfig, 'change', 'config', 'CONFIG');

global.GoatBot.envGlobal = global.GoatBot.configCommands.envGlobal || {};
global.GoatBot.envCommands = global.GoatBot.configCommands.envCommands || {};
global.GoatBot.envEvents = global.GoatBot.configCommands.envEvents || {};

const getText = global.utils.getText || ((file, key) => key);

if (config.autoRestart) {
    const time = config.autoRestart.time;
    if (!isNaN(time) && time > 0) {
        log.info("AUTO RESTART", `Auto restart after ${time}ms`);
        setTimeout(() => {
            log.info("AUTO RESTART", "Restarting...");
            process.exit(2);
        }, time);
    }
}

console.log("\n");
console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║     ██████╗  ██████╗  █████╗ ████████╗██████╗  ██████╗ ████████╗    ║");
console.log("║    ██╔════╝ ██╔═══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██╗╚══██╔══╝    ║");
console.log("║    ██║  ███╗██║   ██║███████║   ██║   ██████╔╝██║   ██║   ██║       ║");
console.log("║    ██║   ██║██║   ██║██╔══██║   ██║   ██╔══██╗██║   ██║   ██║       ║");
console.log("║    ╚██████╔╝╚██████╔╝██║  ██║   ██║   ██████╔╝╚██████╔╝   ██║       ║");
console.log("║     ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═════╝  ╚═════╝    ╚═╝       ║");
console.log("║                                                                      ║");
console.log("║              GoatBot V2 - Instagram Port                            ║");
console.log("║                   Developer: Gtajisan                               ║");
console.log("║         Based on NTKhang's GoatBot V2 (Team Calyx)                  ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log("\n");

require('./bot/login/loginIG.js');
