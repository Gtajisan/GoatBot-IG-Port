const fs = require('fs-extra');
const path = require('path');

const refCmdPath = 'reference/Goatbot-V2-Backup/scripts/cmds';
const refEvtPath = 'reference/Goatbot-V2-Backup/scripts/events';
const myCmdPath = 'commands';
const myEvtPath = 'events';

function getDeps(content) {
    const deps = new Set();
    const matches = [
        { key: 'axios', regex: /axios/i },
        { key: 'ffmpeg', regex: /ffmpeg/i },
        { key: 'jimp', regex: /jimp/i },
        { key: 'canvas', regex: /canvas/i },
        { key: 'TTS', regex: /say|gtts|google-tts/i },
        { key: 'tinyurl', regex: /tinyurl/i },
        { key: 'cheerio', regex: /cheerio/i },
        { key: 'ytdl', regex: /ytdl|distube/i },
        { key: 'form-data', regex: /form-data/i },
        { key: 'database', regex: /usersData|threadsData|globalData|database/i }
    ];
    matches.forEach(m => {
        if (m.regex.test(content)) deps.add(m.key);
    });
    return Array.from(deps);
}

function parseCmd(file, content, isEvent = false) {
    let name = path.basename(file, '.js');
    let purpose = 'N/A';

    if (!isEvent) {
        const nameMatch = content.match(/name:\s*["'](.*?)["']/);
        const descMatch = content.match(/description:\s*["'](.*?)["']/);
        if (nameMatch) name = nameMatch[1];
        if (descMatch) purpose = descMatch[1];
    } else {
        const configMatch = content.match(/config\s*=\s*({[\s\S]*?});/);
        if (configMatch) {
            const nameMatch = configMatch[1].match(/name:\s*["'](.*?)["']/);
            if (nameMatch) name = nameMatch[1];
        }
    }

    return {
        file,
        name: name,
        purpose: purpose,
        deps: getDeps(content),
        isEvent
    };
}

async function run() {
    const inventory = { MISSING: [], WORKING: [], BROKEN: [] };
    const refMap = new Map();

    const processRef = async (dir, isEvent) => {
        if (!fs.existsSync(dir)) return;
        const files = (await fs.readdir(dir)).filter(f => f.endsWith('.js'));
        for (const f of files) {
            const content = await fs.readFile(path.join(dir, f), 'utf-8');
            const parsed = parseCmd(f, content, isEvent);
            refMap.set((isEvent ? 'evt_' : 'cmd_') + parsed.name.toLowerCase(), parsed);
        }
    };

    await processRef(refCmdPath, false);
    await processRef(refEvtPath, true);

    const myFiles = [];
    const processMy = async (dir, isEvent) => {
        if (!fs.existsSync(dir)) return;
        const files = (await fs.readdir(dir)).filter(f => f.endsWith('.js'));
        for (const f of files) {
            const content = await fs.readFile(path.join(dir, f), 'utf-8');
            const parsed = parseCmd(f, content, isEvent);
            myFiles.push({ ...parsed, isEvent });
        }
    };

    await processMy(myCmdPath, false);
    await processMy(myEvtPath, true);

    for (const [key, cmd] of refMap) {
        const match = myFiles.find(m => (m.isEvent ? 'evt_' : 'cmd_') + m.name.toLowerCase() === key);
        if (!match) {
            inventory.MISSING.push(cmd);
        } else {
            inventory.WORKING.push(match);
        }
    }

    // Categorize
    const categorize = (list) => {
        return list.map(c => {
            let category = 'utility';
            if (c.deps.includes('TTS')) category = 'audio';
            else if (c.deps.includes('ffmpeg') || c.deps.includes('ytdl')) category = 'video';
            else if (c.deps.includes('canvas') || c.deps.includes('jimp')) category = 'image';
            else if (c.deps.includes('database')) category = 'admin/db';
            return { ...c, category };
        });
    };

    inventory.MISSING = categorize(inventory.MISSING);
    inventory.WORKING = categorize(inventory.WORKING);

    console.log(JSON.stringify(inventory, null, 2));
}

run();
