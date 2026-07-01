const axios = require('axios');
const { config } = global.GoatBot;
const { log, getText } = global.utils;

if (global.timeOutUptime != undefined)
	clearInterval(global.timeOutUptime);

if (!config.AUTO_UPTIME_ENABLE)
	return;

const PORT = process.env.PORT || config.DASHBOARD_PORT || 3000;

// Render uses RENDER_EXTERNAL_URL to provide the full public URL of the service.
let myUrl = config.AUTO_UPTIME_URL || (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/uptime` : null);

if (!myUrl) {
    // Fallback for local or Replit environments
    myUrl = `http://localhost:${PORT}/uptime`;
}

let status = 'ok';

async function autoUptime() {
	try {
		await axios.get(myUrl);
		if (status != 'ok') {
			status = 'ok';
			log.info("UPTIME", "Bot is online (Aging Connected)");
		}
	}
	catch (e) {
		if (status == 'ok') {
            status = 'failed';
            log.warn("UPTIME", `Uptime check failed for ${myUrl}: ${e.message}`);
        }
	}
}

// Initial delay
setTimeout(() => {
    autoUptime();
	global.timeOutUptime = setInterval(autoUptime, (config.AUTO_UPTIME_INTERVAL || 180) * 1000);
}, 5000);

log.info("AUTO UPTIME", `Auto-uptime started for: ${myUrl}`);
