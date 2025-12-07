
/**
 * EventHandler.js - GoatBot-V2 Event Handler for Instagram
 * Handles Instagram thread events (join, leave, name changes, etc.)
 */

const EventEmitter = require('events');

class EventHandler extends EventEmitter {
    constructor(config, events, database) {
        super();
        this.config = config;
        this.events = events;
        this.database = database;
    }

    /**
     * Convert IG event to Goat event format
     */
    normalizeEvent(igEvent) {
        const baseEvent = {
            type: "event",
            threadID: igEvent.threadID,
            timestamp: igEvent.timestamp || Date.now()
        };

        switch (igEvent.eventType) {
            case "user_join":
                return {
                    ...baseEvent,
                    logMessageType: "log:subscribe",
                    logMessageData: {
                        addedParticipants: igEvent.users.map(id => ({ userFbId: id }))
                    },
                    author: igEvent.author || igEvent.users[0]
                };

            case "user_leave":
                return {
                    ...baseEvent,
                    logMessageType: "log:unsubscribe",
                    logMessageData: {
                        leftParticipantFbId: igEvent.users[0]
                    },
                    author: igEvent.author || igEvent.users[0]
                };

            case "thread_name":
                return {
                    ...baseEvent,
                    logMessageType: "log:thread-name",
                    logMessageData: {
                        name: igEvent.newName
                    },
                    author: igEvent.author
                };

            default:
                return baseEvent;
        }
    }

    /**
     * Handle user join event
     */
    async handleUserJoin(event) {
        const welcomeEvent = this.events.get('welcome');
        if (!welcomeEvent) return;

        try {
            const threadData = await this.database.getThread(event.threadID);
            const newUsers = event.logMessageData.addedParticipants;

            for (const user of newUsers) {
                const userData = await this.database.getUser(user.userFbId);

                const context = {
                    event,
                    api: {
                        sendMessage: (text) => this.sendMessage(text, event.threadID),
                        getUserInfo: (id) => this.database.getUser(id)
                    },
                    threadData,
                    userData,
                    userID: user.userFbId
                };

                await welcomeEvent.onStart(context);
            }

            console.log(`[EVENT] Welcome triggered for ${newUsers.length} user(s)`);

        } catch (error) {
            console.error('[EVENT] Welcome error:', error);
        }
    }

    /**
     * Handle user leave event
     */
    async handleUserLeave(event) {
        const leaveEvent = this.events.get('leave');
        if (!leaveEvent) return;

        try {
            const threadData = await this.database.getThread(event.threadID);
            const leftUserID = event.logMessageData.leftParticipantFbId;
            const userData = await this.database.getUser(leftUserID);

            const context = {
                event,
                api: {
                    sendMessage: (text) => this.sendMessage(text, event.threadID)
                },
                threadData,
                userData,
                userID: leftUserID
            };

            await leaveEvent.onStart(context);

            console.log(`[EVENT] Leave triggered for user ${leftUserID}`);

        } catch (error) {
            console.error('[EVENT] Leave error:', error);
        }
    }

    /**
     * Handle thread name change
     */
    async handleThreadNameChange(event) {
        console.log(`[EVENT] Thread name changed to: ${event.logMessageData.name}`);
        
        await this.database.updateThread(event.threadID, {
            threadName: event.logMessageData.name
        });
    }

    /**
     * Send message via emit (Python bridge will handle)
     */
    async sendMessage(text, threadID) {
        this.emit('sendMessage', { text, threadID });
    }

    /**
     * Main event processing pipeline
     */
    async handleEvent(igEvent) {
        try {
            // Normalize event to Goat format
            const event = this.normalizeEvent(igEvent);

            console.log(`[EVENT] ${event.logMessageType || 'unknown'} in ${event.threadID}`);

            // Route to appropriate handler
            switch (event.logMessageType) {
                case "log:subscribe":
                    await this.handleUserJoin(event);
                    break;

                case "log:unsubscribe":
                    await this.handleUserLeave(event);
                    break;

                case "log:thread-name":
                    await this.handleThreadNameChange(event);
                    break;

                default:
                    console.log(`[EVENT] Unhandled event type: ${event.logMessageType}`);
            }

            this.emit('event', event);

        } catch (error) {
            console.error('[EVENT-HANDLER] Error:', error);
        }
    }
}

module.exports = EventHandler;
