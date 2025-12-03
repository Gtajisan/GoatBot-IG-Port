/**
 * GoatBot Instagram Edition - Entry Point
 * 
 * This starts the Instagram version of GoatBot using ig-chat-api
 */

const { spawn } = require("child_process");

console.log("╔══════════════════════════════════════════════╗");
console.log("║     GoatBot V2 - Instagram Edition           ║");
console.log("║     Using ig-chat-api (Official Graph API)   ║");
console.log("╚══════════════════════════════════════════════╝");

function startProject() {
    const child = spawn("node", ["InstagramGoat.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (code) => {
        if (code === 2) {
            console.log("[GOATBOT] Restarting...");
            startProject();
        } else if (code !== 0) {
            console.log(`[GOATBOT] Process exited with code ${code}`);
        }
    });

    child.on("error", (err) => {
        console.error("[GOATBOT] Failed to start:", err.message);
    });
}

startProject();
