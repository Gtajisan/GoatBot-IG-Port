
/**
 * MessageHandler.js - GoatBot-V2 Message Handler for Instagram
 * Processes incoming Instagram messages through the full Goat pipeline
 */

const { PythonShell } = require('python-shell');
const EventEmitter = require('events');

class MessageHandler extends EventEmitter {
    constructor(config, commands, database) {
        super();
        this.config = config;
        this.commands = commands;
        this.database = database;
        this.cooldowns = new Map();
        this.pythonClient = null;
    }

    /**
     * STEP 1: Preprocess Message
     * Clean and validate incoming message
     */
    preprocessMessage(rawMessage) {
        const message = {
            ...rawMessage,
            body: (rawMessage.body || "").trim(),
            isCommand: false,
            prefix: null,
            commandName: null,
            args: []
        };

        // Detect prefix
        const prefix = this.config.prefix || "!";
        if (message.body.startsWith(prefix)) {
            message.isCommand = true;
            message.prefix = prefix;
            
            const bodyWithoutPrefix = message.body.slice(prefix.length).trim();
            const parts = this.parseArgs(bodyWithoutPrefix);
            message.commandName = parts[0]?.toLowerCase();
            message.args = parts.slice(1);
        }

        return message;
    }

    /**
     * STEP 2: Format Message Object (Goat Standard)
     * Ensure message matches GoatBot-V2 format
     */
    formatMessageObject(message) {
        return {
            senderID: message.senderID,
            senderName: message.senderName,
            threadID: message.threadID,
            messageID: message.messageID,
            body: message.body,
            attachments: message.attachments || [],
            replyTo: message.replyTo || null,
            isGroup: message.isGroup || false,
            mentions: message.mentions || [],
            timestamp: message.timestamp || Date.now(),
            type: "message",
            isCommand: message.isCommand,
            prefix: message.prefix,
            commandName: message.commandName,
            args: message.args
        };
    }

    /**
     * STEP 3: Detect and Trigger Events
     * Check for special events (first message, welcome, etc.)
     */
    async detectAndTriggerEvents(message) {
        const events = [];

        // First message in thread
        const threadData = await this.database.getThread(message.threadID);
        if (!threadData || !threadData.hasReceivedMessage) {
            events.push({ type: 'onFirstMessage', message });
            await this.database.updateThread(message.threadID, { hasReceivedMessage: true });
        }

        // User first message
        const userData = await this.database.getUser(message.senderID);
        if (!userData || !userData.hasSpoken) {
            events.push({ type: 'onUserFirstMessage', message });
            await this.database.updateUser(message.senderID, { hasSpoken: true });
        }

        return events;
    }

    /**
     * STEP 4: Command Parser
     * Parse command with quotes, flags, and special syntax
     */
    parseArgs(text) {
        const args = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = null;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = null;
                if (current) {
                    args.push(current);
                    current = '';
                }
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    args.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current) {
            args.push(current);
        }

        return args;
    }

    /**
     * STEP 5: Permission Check
     * Verify user has permission to run command
     */
    async permissionCheck(message, command) {
        const userRole = await this.getUserRole(message.senderID, message.threadID);

        // Admin-only commands
        if (command.config.role === 2) {
            if (!this.config.adminBot.includes(message.senderID)) {
                return {
                    allowed: false,
                    reason: "This command requires bot admin privileges"
                };
            }
        }

        // Thread admin-only commands
        if (command.config.role === 1) {
            if (userRole < 1 && !this.config.adminBot.includes(message.senderID)) {
                return {
                    allowed: false,
                    reason: "This command requires group admin privileges"
                };
            }
        }

        // Banned users
        const userData = await this.database.getUser(message.senderID);
        if (userData?.banned) {
            return {
                allowed: false,
                reason: `You are banned. Reason: ${userData.banReason}`
            };
        }

        return { allowed: true };
    }

    /**
     * STEP 6: Cooldown Check
     * Prevent command spam
     */
    cooldownCheck(message, command) {
        const cooldownTime = (command.config.cooldown || 3) * 1000;
        const key = `${message.senderID}_${command.config.name}`;

        if (this.cooldowns.has(key)) {
            const lastUsed = this.cooldowns.get(key);
            const timePassed = Date.now() - lastUsed;

            if (timePassed < cooldownTime) {
                const timeLeft = ((cooldownTime - timePassed) / 1000).toFixed(1);
                return {
                    onCooldown: true,
                    timeLeft: timeLeft
                };
            }
        }

        this.cooldowns.set(key, Date.now());
        return { onCooldown: false };
    }

    /**
     * STEP 7: Execute Command
     * Run the command with proper error handling
     */
    async executeCommand(message, command) {
        try {
            const api = {
                sendMessage: (text, threadID) => this.sendMessage(text, threadID || message.threadID),
                react: (emoji, messageID) => this.react(emoji, messageID || message.messageID),
                getUserInfo: (userID) => this.database.getUser(userID),
                getThreadInfo: (threadID) => this.database.getThread(threadID)
            };

            const context = {
                message,
                args: message.args,
                api,
                database: this.database,
                config: this.config
            };

            await command.onStart(context);

            // Log command usage
            console.log(`[CMD] ${command.config.name} | ${message.senderName} | ${message.threadID}`);

        } catch (error) {
            console.error(`[CMD-ERROR] ${command.config.name}:`, error);
            await this.sendMessage(`❌ Command error: ${error.message}`, message.threadID);
        }
    }

    /**
     * STEP 8: Logging & Dashboard Broadcast
     * Log to console and send to dashboard
     */
    logAndBroadcast(message, command, result) {
        const logData = {
            timestamp: Date.now(),
            type: message.isCommand ? 'command' : 'message',
            commandName: command?.config?.name,
            senderID: message.senderID,
            senderName: message.senderName,
            threadID: message.threadID,
            body: message.body,
            result: result
        };

        console.log(`[LOG] ${JSON.stringify(logData)}`);
        this.emit('log', logData);
    }

    /**
     * Get user role (0 = member, 1 = thread admin, 2 = bot admin)
     */
    async getUserRole(userID, threadID) {
        if (this.config.adminBot.includes(userID)) {
            return 2;
        }

        const threadData = await this.database.getThread(threadID);
        if (threadData?.adminIDs?.includes(userID)) {
            return 1;
        }

        return 0;
    }

    /**
     * Send message via Python bridge
     */
    async sendMessage(text, threadID) {
        return new Promise((resolve, reject) => {
            this.emit('sendMessage', { text, threadID });
            resolve();
        });
    }

    /**
     * React to message via Python bridge
     */
    async react(emoji, messageID) {
        return new Promise((resolve, reject) => {
            this.emit('react', { emoji, messageID });
            resolve();
        });
    }

    /**
     * Main message processing pipeline
     */
    async handleMessage(rawMessage) {
        try {
            // Pipeline Step 1: Preprocess
            let message = this.preprocessMessage(rawMessage);

            // Pipeline Step 2: Format
            message = this.formatMessageObject(message);

            // Pipeline Step 3: Detect Events
            const events = await this.detectAndTriggerEvents(message);
            for (const event of events) {
                this.emit('event', event);
            }

            // Pipeline Step 4-8: Command handling
            if (message.isCommand && message.commandName) {
                const command = this.commands.get(message.commandName);

                if (!command) {
                    console.log(`[CMD] Unknown command: ${message.commandName}`);
                    return;
                }

                // Step 5: Permission check
                const permCheck = await this.permissionCheck(message, command);
                if (!permCheck.allowed) {
                    await this.sendMessage(permCheck.reason, message.threadID);
                    return;
                }

                // Step 6: Cooldown check
                const cooldownCheck = this.cooldownCheck(message, command);
                if (cooldownCheck.onCooldown) {
                    await this.sendMessage(`⏳ Cooldown: ${cooldownCheck.timeLeft}s`, message.threadID);
                    return;
                }

                // Step 7: Execute
                await this.executeCommand(message, command);

                // Step 8: Log
                this.logAndBroadcast(message, command, 'success');
            }

        } catch (error) {
            console.error('[MESSAGE-HANDLER] Error:', error);
            this.logAndBroadcast(rawMessage, null, 'error');
        }
    }
}

module.exports = MessageHandler;
