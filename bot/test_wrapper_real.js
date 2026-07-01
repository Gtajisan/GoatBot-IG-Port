const createDualFca = require('./DualFca');
const { login } = require('@neoaz07/nkxica');
const fs = require('fs');

async function run() {
    const cookies = fs.readFileSync('account.txt', 'utf-8');
    const primary = await login(cookies);
    const threadID = '49212864825';

    // Create wrapper with no secondary for now since Instagram-FCA login fails
    const api = createDualFca(primary, null);

    console.log('Testing real primary with wrapper...');
    try {
        const res = await api.sendMessage('Real test through DualFca wrapper', threadID);
        console.log('Success:', res);
    } catch (e) {
        console.error('Failed:', e.message);
    }
}

run();
