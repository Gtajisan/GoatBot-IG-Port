const fs = require('fs');

function parseNetscapeCookies(content) {
    const cookies = [];
    const lines = content.split('\n');
    for (let line of lines) {
        let l = line.trim();
        if (!l || (l.startsWith('#') && !l.startsWith('#HttpOnly_'))) continue;

        let httpOnly = false;
        if (l.startsWith('#HttpOnly_')) {
            httpOnly = true;
            l = l.substring(10);
        }

        const parts = l.split('\t');
        if (parts.length < 7) continue;

        cookies.push({
            key: parts[5],
            value: parts[6],
            domain: parts[0],
            path: parts[2],
            secure: parts[3] === 'TRUE',
            httpOnly: httpOnly,
            expires: parseInt(parts[4])
        });
    }
    return cookies;
}

const cookieContent = fs.readFileSync('account.txt', 'utf-8');
const appState = parseNetscapeCookies(cookieContent);
fs.writeFileSync('appstate.json', JSON.stringify(appState, null, 2));
console.log('Converted to appstate.json');
