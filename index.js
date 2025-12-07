
const fs = require('fs-extra');
const path = require('path');
const login = require('./ig-chat-api');
const logger = require('./logger/log');

async function startBot() {
    try {
        logger.info('INSTAGRAM GOATBOT', 'Starting Instagram GoatBot V2 Port...');
        
        // Initialize global objects similar to GoatBot V2
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
            config: require('./config.json'),
            configCommands: require('./configCommands.json'),
            envCommands: {},
            envEvents: {},
            envGlobal: {},
            reLoginBot: function () {},
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
            dirConfig: path.normalize(`${__dirname}/config.json`),
            dirConfigCommands: path.normalize(`${__dirname}/configCommands.json`),
            dirAccount: path.normalize(`${__dirname}/account.txt`),
            countDown: {},
            cache: {},
            database: {
                creatingThreadData: [],
                creatingUserData: [],
                creatingDashBoardData: [],
                creatingGlobalData: []
            },
            commandBanned: global.GoatBot.configCommands.commandBanned || {}
        };

        const utils = require("./utils.js");
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

        // Load account credentials
        const accountData = await fs.readFile(global.client.dirAccount, 'utf8');
        let accounts = [];
        
        try {
            accounts = JSON.parse(accountData);
        } catch (e) {
            logger.warn('ACCOUNT', 'account.txt is not valid JSON, treating as empty');
            accounts = [];
        }

        if (!Array.isArray(accounts)) {
            accounts = [accounts];
        }

        if (accounts.length === 0) {
            logger.warn('ACCOUNT', 'No Instagram accounts found in account.txt');
            logger.info('ACCOUNT', 'Please add Instagram access token and page ID to account.txt');
            logger.info('ACCOUNT', 'Format: [{"accessToken": "YOUR_TOKEN", "igUserID": "YOUR_PAGE_ID"}]');
        }

        // Start with environment variables or first account
        const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || 
                          process.env.IG_ACCESS_TOKEN || 
                          accounts[0]?.accessToken;
        
        const pageID = process.env.INSTAGRAM_PAGE_ID || 
                      process.env.IG_USER_ID || 
                      accounts[0]?.igUserID || 
                      accounts[0]?.pageID;

        if (!accessToken || !pageID) {
            logger.error('LOGIN', 'Missing Instagram credentials. Set environment variables or update account.txt');
            process.exit(1);
        }

        logger.info('LOGIN', 'Attempting to login to Instagram...');

        // Login to Instagram
        const loginData = {
            accessToken: accessToken,
            igUserID: pageID,
            pageID: pageID,
            verifyToken: process.env.IG_VERIFY_TOKEN || 'goatbot_ig_verify'
        };

        const loginOptions = {
            listenEvents: true,
            selfListen: false,
            autoMarkDelivery: true,
            updatePresence: false,
            logLevel: 'info',
            webhookPort: process.env.PORT || 5000
        };

        const api = await login(loginData, loginOptions);
        
        global.GoatBot.fcaApi = api;
        global.GoatBot.botID = api.getCurrentUserID();
        global.botID = api.getCurrentUserID();

        logger.info('LOGIN', 'Successfully logged in to Instagram');
        logger.info('BOT INFO', `Bot ID: ${global.botID}`);
        logger.info('PREFIX', global.GoatBot.config.prefix);

        // Load database
        const loadData = require('./bot/login/loadData.js');
        const { threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData } = 
            await loadData(api, utils.createOraDots);

        // Load scripts
        const loadScripts = require('./bot/login/loadScripts.js');
        await loadScripts(api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, utils.createOraDots);

        // Start dashboard if enabled
        if (global.GoatBot.config.dashBoard?.enable === true) {
            try {
                await require('./dashboard/app.js')(api);
                logger.success('DASHBOARD', `Dashboard running on port ${global.GoatBot.config.dashBoard.port || 3001}`);
            } catch (err) {
                logger.error('DASHBOARD', 'Failed to start dashboard:', err);
            }
        }

        // Setup message handler
        const handlerAction = require('./bot/handler/handlerAction.js')(
            api, threadModel, userModel, dashBoardModel, globalModel, 
            usersData, threadsData, dashBoardData, globalData
        );

        // Start listening for messages
        const stopListening = api.listen((err, event) => {
            if (err) {
                logger.error('LISTEN', 'Error in listen callback:', err);
                return;
            }
            
            handlerAction(event);
        });

        global.GoatBot.Listening = stopListening;

        logger.success('BOT', 'Instagram GoatBot is now running!');
        logger.info('WEBHOOK', `Webhook URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/webhook`);
        logger.info('WEBHOOK', `Verify Token: ${loginData.verifyToken}`);

    } catch (error) {
        logger.error('FATAL', 'Bot startup failed:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('SHUTDOWN', 'Shutting down gracefully...');
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    logger.error('UNHANDLED REJECTION', error);
});

process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION', error);
});

startBot();
