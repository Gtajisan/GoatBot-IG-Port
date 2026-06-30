const loginFca = require('./instagram-fca/login-wrapper');
const fs = require('fs');

async function test() {
    const netscapeData = fs.readFileSync('account.txt', 'utf-8');
    console.log('Testing Netscape parsing in login-wrapper...');

    const api = require('./instagram-fca/index');
    // Test the payload generation
    const login = require('./instagram-fca/src/login');

    const appState = [
        { name: 'sessionid', value: '123', domain: '.instagram.com', path: '/', secure: true, httpOnly: true, expires: 1783321278 }
    ];

    try {
        console.log('Testing manual call to src/login...');
        await login({ appState }, { logLevel: 'info' });
    } catch (e) {
        console.log('Manual call error:', e.message);
    }
}
test();
