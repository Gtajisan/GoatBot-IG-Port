
/**
 * GoatBot V2 - Universal Entry Point
 * Supports both Facebook Messenger and Instagram
 */

const { spawn } = require("child_process");
const fs = require("fs");

console.log("╔══════════════════════════════════════════════╗");
console.log("║          GoatBot V2 - Multi-Platform         ║");
console.log("╚══════════════════════════════════════════════╝");

// Detect platform based on environment variables
const isInstagram = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.IG_ACCESS_TOKEN;
const isFacebook = fs.existsSync("./account.txt") || process.env.FACEBOOK_EMAIL;

let botFile;
if (isInstagram) {
    console.log("🟣 Platform: Instagram (using ig-chat-api)");
    botFile = "InstagramGoat.js";
} else if (isFacebook) {
    console.log("🔵 Platform: Facebook Messenger (using fca-unofficial)");
    botFile = "Goat.js";
} else {
    console.error("❌ No platform credentials found!");
    console.log("\nFor Instagram:");
    console.log("  - Set INSTAGRAM_ACCESS_TOKEN in .env");
    console.log("  - Set INSTAGRAM_PAGE_ID in .env");
    console.log("\nFor Facebook:");
    console.log("  - Add credentials to account.txt");
    console.log("  - Or set FACEBOOK_EMAIL and FACEBOOK_PASSWORD");
    process.exit(1);
}

function startProject() {
    const child = spawn("node", ["--trace-warnings", botFile], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (code) => {
        if (code === 2) {
            console.log("[GOATBOT] Restarting...");
            setTimeout(startProject, 1000);
        } else if (code !== 0) {
            console.error(`[GOATBOT] Process exited with code ${code}`);
        }
    });

    child.on("error", (error) => {
        console.error("[GOATBOT] Failed to start:", error);
    });
}

console.log(`\nStarting ${botFile}...\n`);
startProject();
