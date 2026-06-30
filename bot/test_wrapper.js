const createDualFca = require('./DualFca');
const logger = require('../utils/logger');

// Mock primary
const mockPrimary = {
    sendMessage: async (msg, id) => {
        console.log('Primary sending:', msg);
        if (msg === 'fail') throw new Error('Primary failed');
        return { success: true, from: 'primary' };
    }
};

// Mock secondary
const mockSecondary = {
    sendMessage: async (msg, id) => {
        console.log('Secondary (Fallback) sending:', msg);
        return { success: true, from: 'secondary' };
    }
};

async function runTest() {
    console.log('--- Testing DualFca Wrapper ---');

    // Test 1: Success on primary
    const api1 = createDualFca(mockPrimary, mockSecondary);
    console.log('Test 1: Success on primary');
    const res1 = await api1.sendMessage('hello', '123');
    console.log('Result 1:', res1);

    // Test 2: Failure on primary, fallback disabled
    console.log('\nTest 2: Failure on primary, fallback disabled');
    global.config = { USE_FCA_FALLBACK: { text: false } }; // Manual override for test
    try {
        await api1.sendMessage('fail', '123');
    } catch (e) {
        console.log('Caught expected error:', e.message);
    }

    // Test 3: Failure on primary, fallback enabled
    console.log('\nTest 3: Failure on primary, fallback enabled');
    // We need to actually mock the config required by DualFca
    require('../config').USE_FCA_FALLBACK = { text: true };
    const res3 = await api1.sendMessage('fail', '123');
    console.log('Result 3:', res3);
}

runTest();
