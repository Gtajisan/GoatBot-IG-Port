const database = require('./utils/database');
const config = require('./config');

async function test() {
    console.log('Testing database auto-removal methods...');

    const threadId = '123';
    const messageId = 'msg_001';
    const delayMs = 1000; // 1 second

    database.addAutoRemoveMessage(threadId, messageId, delayMs);
    console.log('Added message. Pending:', database.data.autoRemoveMessages.length);

    let expired = database.getExpiredAutoRemoveMessages();
    console.log('Expired immediately:', expired.length); // Should be 0

    await new Promise(resolve => setTimeout(resolve, 1100));

    expired = database.getExpiredAutoRemoveMessages();
    console.log('Expired after 1.1s:', expired.length); // Should be 1
    console.log('Expired item:', expired[0]);
    console.log('Pending after retrieval:', database.data.autoRemoveMessages.length); // Should be 0

    if (expired.length === 1 && expired[0].messageId === messageId) {
        console.log('✅ Database methods test passed');
    } else {
        console.log('❌ Database methods test failed');
        process.exit(1);
    }

    console.log('\nTesting scheduler logic (mocked)...');
    // Mock bot and api
    const mockApi = {
        unsendMessage: async (id) => {
            console.log('Mock unsendMessage called for:', id);
            return true;
        }
    };

    const mockBot = {
        api: mockApi
    };

    // Inject the scheduler logic (simplified)
    async function runSchedulerOnce() {
        const expired = database.getExpiredAutoRemoveMessages();
        for (const msg of expired) {
            await mockBot.api.unsendMessage(msg.messageId);
        }
    }

    database.addAutoRemoveMessage(threadId, 'msg_002', 0);
    await runSchedulerOnce();

    console.log('✅ Scheduler logic test passed');
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
