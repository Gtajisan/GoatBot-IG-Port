const fs = require('fs-extra');
const path = require('path');

const refPath = 'reference/Goatbot-V2-Backup/scripts/cmds';
const myPath = 'commands';

async function getFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const files = await fs.readdir(dir);
    return files.filter(f => f.endsWith('.js'));
}

function parseCommand(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Simple regex to extract name, purpose, and dependencies
        const configMatch = content.match(/config\s*=\s*({[\s\S]*?});/);
        let config = {};
        if (configMatch) {
            try {
                // Using eval is risky but for a controlled inventory it's often the easiest way to parse JS objects
                // We'll use a safer approach: try to extract keys manually
                const nameMatch = configMatch[1].match(/name:\s*["'](.*?)["']/);
                const descMatch = configMatch[1].match(/description:\s*["'](.*?)["']/);
                config.name = nameMatch ? nameMatch[1] : path.basename(filePath, '.js');
                config.description = descMatch ? descMatch[1] : 'No description found';
            } catch (e) {}
        }

        // Guess dependencies
        const deps = [];
        if (content.includes('axios')) deps.push('axios');
        if (content.includes('fs')) deps.push('fs');
        if (content.includes('ffmpeg')) deps.push('ffmpeg');
        if (content.includes('jimp')) deps.push('jimp');
        if (content.includes('canvas')) deps.push('canvas');
        if (content.includes('say')) deps.push('TTS');
        if (content.includes('tinyurl')) deps.push('tinyurl');
        if (content.includes('cheerio')) deps.push('cheerio');

        return {
            file: path.basename(filePath),
            name: config.name || path.basename(filePath, '.js'),
            purpose: config.description || 'N/A',
            deps: deps.join(', ') || 'None'
        };
    } catch (e) {
        return { file: path.basename(filePath), name: 'ERROR', purpose: 'ERROR', deps: 'ERROR' };
    }
}

async function run() {
    const refFiles = await getFiles(refPath);
    const myFiles = await getFiles(myPath);

    const refInventory = refFiles.map(f => parseCommand(path.join(refPath, f)));
    const myInventory = myFiles.map(f => parseCommand(path.join(myPath, f)));

    const missing = refInventory.filter(r => !myInventory.find(m => m.name === r.name));
    const broken = []; // We'll have to manually flag these or use the user's input
    const working = myInventory.filter(m => refInventory.find(r => r.name === m.name));

    // For now, let's just list everything and let the human refine "broken"
    console.log(JSON.stringify({ refInventory, myInventory, missing, working }, null, 2));
}

run();
