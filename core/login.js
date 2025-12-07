
const { IgApiClient } = require('instagram-private-api');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

async function login(accountData, config) {
    try {
        const ig = new IgApiClient();
        
        // Set device and user agent
        ig.state.generateDevice(accountData.username || 'goatbot_user');
        
        // Login via cookies if provided
        if (accountData.cookies) {
            logger.info('Attempting cookie-based login...');
            
            // Restore session from cookies
            await ig.state.deserializeCookieJar(JSON.stringify(accountData.cookies));
            
            // Verify session is valid
            try {
                const user = await ig.account.currentUser();
                logger.success(`Logged in as ${user.username} (${user.pk})`);
                
                // Save updated cookies
                const cookies = await ig.state.serializeCookieJar();
                accountData.cookies = JSON.parse(cookies);
                await saveAccountData(accountData);
                
                return createAPI(ig, user, config);
                
            } catch (error) {
                logger.warn('Cookie session expired, attempting credential login...');
                return await loginWithCredentials(ig, accountData, config);
            }
            
        } else if (accountData.username && accountData.password) {
            return await loginWithCredentials(ig, accountData, config);
            
        } else {
            throw new Error('No valid login method found. Provide cookies or username/password.');
        }
        
    } catch (error) {
        logger.error('Login error:', error.message);
        throw error;
    }
}

async function loginWithCredentials(ig, accountData, config) {
    logger.info(`Logging in with username: ${accountData.username}`);
    
    await ig.simulate.preLoginFlow();
    const auth = await ig.account.login(accountData.username, accountData.password);
    await ig.simulate.postLoginFlow();
    
    logger.success(`Logged in as ${auth.username} (${auth.pk})`);
    
    // Save cookies for future logins
    const cookies = await ig.state.serializeCookieJar();
    accountData.cookies = JSON.parse(cookies);
    await saveAccountData(accountData);
    
    return createAPI(ig, auth, config);
}

async function saveAccountData(accountData) {
    try {
        const accountFile = path.join(__dirname, '../account.txt');
        const accounts = JSON.parse(await fs.readFile(accountFile, 'utf8'));
        
        const index = accounts.findIndex(acc => 
            acc.username === accountData.username || 
            JSON.stringify(acc.cookies) === JSON.stringify(accountData.cookies)
        );
        
        if (index !== -1) {
            accounts[index] = accountData;
        } else {
            accounts.push(accountData);
        }
        
        await fs.writeFile(accountFile, JSON.stringify(accounts, null, 2));
        logger.debug('Account data saved');
        
    } catch (error) {
        logger.error('Error saving account data:', error);
    }
}

function createAPI(ig, user, config) {
    return {
        ig,
        user,
        config,
        
        // Message sending
        async sendMessage(threadId, message) {
            try {
                const thread = ig.entity.directThread(threadId);
                await thread.broadcastText(message);
                return true;
            } catch (error) {
                logger.error('Error sending message:', error);
                return false;
            }
        },
        
        // Listen for messages
        async listen(callback) {
            const feed = ig.feed.directInbox();
            
            setInterval(async () => {
                try {
                    const threads = await feed.items();
                    
                    for (const thread of threads) {
                        const messages = thread.items || [];
                        
                        for (const message of messages) {
                            if (message.user_id !== user.pk && !message.processed) {
                                message.processed = true;
                                callback(null, {
                                    threadID: thread.thread_id,
                                    messageID: message.item_id,
                                    senderID: message.user_id,
                                    body: message.text || '',
                                    isGroup: thread.is_group,
                                    mentions: message.mentioned_user_ids || [],
                                    attachments: message.media || []
                                });
                            }
                        }
                    }
                } catch (error) {
                    logger.error('Error in listen loop:', error);
                }
            }, 3000);
        },
        
        // Get user info
        async getUserInfo(userId) {
            try {
                const userInfo = await ig.user.info(userId);
                return {
                    id: userInfo.pk,
                    username: userInfo.username,
                    fullName: userInfo.full_name,
                    profilePic: userInfo.profile_pic_url
                };
            } catch (error) {
                logger.error('Error getting user info:', error);
                return null;
            }
        },
        
        // React to message
        async setReaction(messageId, reaction) {
            try {
                await ig.directThread.broadcastReaction({
                    itemId: messageId,
                    reactionType: reaction
                });
                return true;
            } catch (error) {
                logger.error('Error setting reaction:', error);
                return false;
            }
        },
        
        // Mark as seen
        async markAsRead(threadId) {
            try {
                const thread = ig.entity.directThread(threadId);
                await thread.markItemSeen(threadId);
                return true;
            } catch (error) {
                logger.error('Error marking as read:', error);
                return false;
            }
        }
    };
}

module.exports = login;
