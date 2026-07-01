const fs = require('fs');
const inventory = JSON.parse(fs.readFileSync('inventory.json', 'utf8'));

console.log("# GOAT BOT V2 PORTING INVENTORY\n");

function printBucket(name, list) {
    console.log(`## ${name} (${list.length})`);
    console.log("| File | Command | Purpose | Category | Dependencies |");
    console.log("| :--- | :--- | :--- | :--- | :--- |");
    list.sort((a, b) => a.category.localeCompare(b.category)).forEach(c => {
        console.log(`| ${c.file} | ${c.name} | ${c.purpose} | ${c.category} | ${c.deps.join(', ') || 'None'} |`);
    });
    console.log("\n");
}

printBucket("MISSING", inventory.MISSING);
printBucket("WORKING/MATCHED", inventory.WORKING);
