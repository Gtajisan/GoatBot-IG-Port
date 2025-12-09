// set bash title
process.stdout.write("\x1b]2;Goat Bot V2 - Made by NTKhang Fixed by Team Calyx\x1b\x5c");
const defaultRequire = require;

function decode(text) {
	text = Buffer.from(text, 'hex').toString('utf-8');
	text = Buffer.from(text, 'hex').toString('utf-8');
	text = Buffer.from(text, 'base64').toString('utf-8');
	return text;
}

const gradient = defaultRequire("gradient-string");
const axios = defaultRequire("axios");
const path = defaultRequire("path");
const readline = defaultRequire("readline");
const fs = defaultRequire("fs-extra");
const toptp = defaultRequire("totp-generator");
const login = require("@dongdev/fca-unofficial");

//const login = require(`${process.cwd()}/fb-chat-api`);
const qr = new (defaultRequire("qrcode-reader"));
const Canvas = defaultRequire("canvas");
const https = defaultRequire("https");

async function getName(userID, api) {
	try {
		if (api && api.getUserInfo) {
			const userInfo = await api.getUserInfo(userID);
			return userInfo[userID]?.name || null;
		}
		return null;
	}
	catch (error) {
		return null;
	}
}


function compareVersion(version1, version2) {
	const v1 = version1.split(".");
	const v2 = version2.split(".");
	for (let i = 0; i < 3; i++) {
		if (parseInt(v1[i]) > parseInt(v2[i]))
			return 1; // version1 > version2
		if (parseInt(v1[i]) < parseInt(v2[i]))
			return -1; // version1 < version2
	}
	return 0; // version1 = version2
}

const { writeFileSync, readFileSync, existsSync, watch } = require("fs-extra");
const handlerWhenListenHasError = require("./handlerWhenListenHasError.js");
const checkLiveCookie = require("./checkLiveCookie.js");
const { callbackListenTime, storage5Message } = global.GoatBot;
const { log, logColor, getPrefix, createOraDots, jsonStringifyColor, getText, convertTime, colors, randomString } = global.utils;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const currentVersion = require(`${process.cwd()}/package.json`).version;

function centerText(text, length) {
	const width = process.stdout.columns;
	const leftPadding = Math.floor((width - (length || text.length)) / 2);
	const rightPadding = width - leftPadding - (length || text.length);
	// Build the padded string using the calculated padding values
	const paddedString = ' '.repeat(leftPadding > 0 ? leftPadding : 0) + text + ' '.repeat(rightPadding > 0 ? rightPadding : 0);
	// Print the padded string to the terminal
	console.log(paddedString);
}

// logo
const titles = [
	[
		"██████╗  ██████╗  █████╗ ████████╗    ██╗   ██╗██████╗",
		"██╔════╝ ██╔═══██╗██╔══██╗╚══██╔══╝    ██║   ██║╚════██╗",
		"██║  ███╗██║   ██║███████║   ██║       ██║   ██║ █████╔╝",
		"██║   ██║██║   ██║██╔══██║   ██║       ╚██╗ ██╔╝██╔═══╝",
		"╚██████╔╝╚██████╔╝██║  ██║   ██║        ╚████╔╝ ███████╗",
		"╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝         ╚═══╝  ╚══════╝"
	],
	[
		"█▀▀ █▀█ ▄▀█ ▀█▀  █▄▄ █▀█ ▀█▀  █░█ ▀█",
		"█▄█ █▄█ █▀█ ░█░  █▄█ █▄█ ░█░  ▀▄▀ █▄"
	],
	[
		"G O A T B O T  V 2 @" + currentVersion
	],
	[
		"GOATBOT V2"
	]
];
const maxWidth = process.stdout.columns;
const title = maxWidth > 58 ?
	titles[0] :
	maxWidth > 36 ?
		titles[1] :
		maxWidth > 26 ?
			titles[2] :
			titles[3];

console.log(gradient("#f5af19", "#f12711")(createLine(null, true)));
console.log();
for (const text of title) {
	const textColor = gradient("#FA8BFF", "#2BD2FF", "#2BFF88")(text);
	centerText(textColor, text.length);
}
let subTitle = `GoatBot V2@${currentVersion}- A simple Bot chat messenger use personal account`;
const subTitleArray = [];
if (subTitle.length > maxWidth) {
	while (subTitle.length > maxWidth) {
		let lastSpace = subTitle.slice(0, maxWidth).lastIndexOf(' ');
		lastSpace = lastSpace == -1 ? maxWidth : lastSpace;
		subTitleArray.push(subTitle.slice(0, lastSpace).trim());
		subTitle = subTitle.slice(lastSpace).trim();
	}
	subTitle ? subTitleArray.push(subTitle) : '';
}
else {
	subTitleArray.push(subTitle);
}
const author = ("Created by NTKhang with ♡");
const srcUrl = ("Source code: https://github.com/Team-Calyx/GoatBot-V2");
const fakeRelease = ("ALL VERSIONS NOT RELEASED HERE ARE FAKE");
for (const t of subTitleArray) {
	const textColor2 = gradient("#9F98E8", "#AFF6CF")(t);
	centerText(textColor2, t.length);
}
centerText(gradient("#9F98E8", "#AFF6CF")(author), author.length);
centerText(gradient("#9F98E8", "#AFF6CF")(srcUrl), srcUrl.length);
centerText(gradient("#f5af19", "#f12711")(fakeRelease), fakeRelease.length);

let widthConsole = process.stdout.columns;
if (widthConsole > 50)
	widthConsole = 50;

function createLine(content, isMaxWidth = false) {
	if (!content)
		return Array(isMaxWidth ? process.stdout.columns : widthConsole).fill("─").join("");
	else {
		content = ` ${content.trim()} `;
		const lengthContent = content.length;
		const lengthLine = isMaxWidth ? process.stdout.columns - lengthContent : widthConsole - lengthContent;
		let left = Math.floor(lengthLine / 2);
		if (left < 0 || isNaN(left))
			left = 0;
		const lineOne = Array(left).fill("─").join("");
		return lineOne + content + lineOne;
	}
}

const character = createLine();

const clearLines = (n) => {
	for (let i = 0; i < n; i++) {
		const y = i === 0 ? null : -1;
		process.stdout.moveCursor(0, y);
		process.stdout.clearLine(1);
	}
	process.stdout.cursorTo(0);
	process.stdout.write('');
};

async function input(prompt, isPassword = false) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	if (isPassword)
		rl.input.on("keypress", function () {
			// get the number of characters entered so far:
			const len = rl.line.length;
			// move cursor back to the beginning of the input:
			readline.moveCursor(rl.output, -len, 0);
			// clear everything to the right of the cursor:
			readline.clearLine(rl.output, 1);
			// replace the original input with asterisks:
			for (let i = 0; i < len; i++) {
				rl.output.write("*");
			}
		});

	return new Promise(resolve => rl.question(prompt, ans => {
		rl.close();
		resolve(ans);
	}));
}

qr.readQrCode = async function (filePath) {
	const image = await Canvas.loadImage(filePath);
	const canvas = Canvas.createCanvas(image.width, image.height);
	const ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0);
	const data = ctx.getImageData(0, 0, image.width, image.height);
	let value;
	qr.callback = function (error, result) {
		if (error)
			throw error;
		value = result;
	};
	qr.decode(data);
	return value.result;
};

const { dirAccount } = global.client;
// const { config, configCommands } = global.GoatBot;
const { facebookAccount } = global.GoatBot.config;

function responseUptimeSuccess(req, res) {
	res.type('json').send({
		status: "success",
		uptime: process.uptime(),
		unit: "seconds"
	});
}

function responseUptimeError(req, res) {
	res.status(500).type('json').send({
		status: "error",
		uptime: process.uptime(),
		statusAccountBot: global.statusAccountBot
	});
}

function checkAndTrimString(string) {
	if (typeof string == "string")
		return string.trim();
	return string;
}

function filterKeysAppState(appState) {
	return appState.filter(item => ["c_user", "xs", "datr", "fr", "sb", "i_user"].includes(item.key));
}

global.responseUptimeCurrent = responseUptimeSuccess;
global.responseUptimeSuccess = responseUptimeSuccess;
global.responseUptimeError = responseUptimeError;

global.statusAccountBot = 'good';
let changeFbStateByCode = false;
let latestChangeContentAccount = fs.statSync(dirAccount).mtimeMs;
let dashBoardIsRunning = false;


async function getAppStateFromEmail(spin = { _start: () => { }, _stop: () => { } }, facebookAccount) {
	const { email, password, userAgent, proxy } = facebookAccount;
	const getFbstate = require(process.env.NODE_ENV === 'development' ? "./getFbstate1.dev.js" : "./getFbstate1.js");
	let code2FATemp;
	let appState;
	try {
		try {
			appState = await getFbstate(checkAndTrimString(email), checkAndTrimString(password), userAgent, proxy);
			spin._stop();
		}
		catch (err) {
			if (err.continue) {
				let tryNumber = 0;
				let isExit = false;

				await (async function submitCode(message) {
					if (message && isExit) {
						spin._stop();
						log.error("LOGIN FACEBOOK", message);
						process.exit();
					}

					if (message) {
						spin._stop();
						log.warn("LOGIN FACEBOOK", message);
					}

					if (facebookAccount["2FASecret"] && tryNumber == 0) {
						switch (['.png', '.jpg', '.jpeg'].some(i => facebookAccount["2FASecret"].endsWith(i))) {
							case true:
								code2FATemp = (await qr.readQrCode(`${process.cwd()}/${facebookAccount["2FASecret"]}`)).replace(/.*secret=(.*)&digits.*/g, '$1');
								break;
							case false:
								code2FATemp = facebookAccount["2FASecret"];
								break;
						}
					}
					else {
						spin._stop();
						code2FATemp = await input("> Enter 2FA code or secret: ");
						readline.moveCursor(process.stderr, 0, -1);
						readline.clearScreenDown(process.stderr);
					}

					const code2FA = isNaN(code2FATemp) ?
						toptp(
							code2FATemp.normalize("NFD")
								.toLowerCase()
								.replace(/[\u0300-\u036f]/g, "")
								.replace(/[đ|Đ]/g, (x) => x == "đ" ? "d" : "D")
								.replace(/\(|\)|\,/g, "")
								.replace(/ /g, "")
						) :
						code2FATemp;
					spin._start();
					try {
						appState = JSON.parse(JSON.stringify(await err.continue(code2FA)));
						appState = appState.map(item => ({
							key: item.key,
							value: item.value,
							domain: item.domain,
							path: item.path,
							hostOnly: item.hostOnly,
							creation: item.creation,
							lastAccessed: item.lastAccessed
						})).filter(item => item.key);
						spin._stop();
					}
					catch (err) {
						tryNumber++;
						if (!err.continue)
							isExit = true;
						await submitCode(err.message);
					}
				})(err.message);
			}
			else
				throw err;
		}
	}
	catch (err) {
		const loginMbasic = require(process.env.NODE_ENV === 'development' ? "./loginMbasic.dev.js" : "./loginMbasic.js");
		if (facebookAccount["2FASecret"]) {
			switch (['.png', '.jpg', '.jpeg'].some(i => facebookAccount["2FASecret"].endsWith(i))) {
				case true:
					code2FATemp = (await qr.readQrCode(`${process.cwd()}/${facebookAccount["2FASecret"]}`)).replace(/.*secret=(.*)&digits.*/g, '$1');
					break;
				case false:
					code2FATemp = facebookAccount["2FASecret"];
					break;
			}
		}

		appState = await loginMbasic({
			email,
			pass: password,
			twoFactorSecretOrCode: code2FATemp,
			userAgent,
			proxy
		});

		appState = appState.map(item => {
			item.key = item.name;
			delete item.name;
			return item;
		});
		appState = filterKeysAppState(appState);
	}

	global.GoatBot.config.facebookAccount['2FASecret'] = code2FATemp || "";
	writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
	return appState;
}

function isNetScapeCookie(cookie) {
	if (typeof cookie !== 'string')
		return false;
	return /(.+)\t(1|TRUE|true)\t([\w\/.-]*)\t(1|TRUE|true)\t\d+\t([\w-]+)\t(.+)/i.test(cookie);
	// match
}

function netScapeToCookies(cookieData) {
	const cookies = [];
	const lines = cookieData.split('\n');
	lines.forEach((line) => {
		if (line.trim().startsWith('#')) {
			return;
		}
		const fields = line.split('\t').map((field) => field.trim()).filter((field) => field.length > 0);
		if (fields.length < 7) {
			return;
		}
		const cookie = {
			key: fields[5],
			value: fields[6],
			domain: fields[0],
			path: fields[2],
			hostOnly: fields[1] === 'TRUE',
			creation: new Date(fields[4] * 1000).toISOString(),
			lastAccessed: new Date().toISOString()
		};
		cookies.push(cookie);
	});
	return cookies;
}

function pushI_user(appState, value) {
	appState.push({
		key: "i_user",
		value: value || facebookAccount.i_user,
		domain: "facebook.com",
		path: "/",
		hostOnly: false,
		creation: new Date().toISOString(),
		lastAccessed: new Date().toISOString()
	});
	return appState;
}

let spin;
async function getAppStateToLogin(loginWithEmail) {
	let appState = [];
	if (loginWithEmail)
		return await getAppStateFromEmail(undefined, facebookAccount);
	if (!existsSync(dirAccount))
		return log.error("LOGIN FACEBOOK", getText('login', 'notFoundDirAccount', colors.green(dirAccount)));
	const accountText = readFileSync(dirAccount, "utf8");

	try {
		const splitAccountText = accountText.replace(/\|/g, '\n').split('\n').map(i => i.trim()).filter(i => i);
		// is token full permission
		if (accountText.startsWith('EAAAA')) {
			try {
				spin = createOraDots(getText('login', 'loginToken'));
				spin._start();
				appState = await require('./getFbstate.js')(accountText);
			}
			catch (err) {
				err.name = "TOKEN_ERROR";
				throw err;
			}
		}
		// is cookie string
		else {
			if (accountText.match(/^(?:\s*\w+\s*=\s*[^;]*;?)+/)) {
				spin = createOraDots(getText('login', 'loginCookieString'));
				spin._start();
				appState = accountText.split(';')
					.map(i => {
						const [key, value] = i.split('=');
						return {
							key: (key || "").trim(),
							value: (value || "").trim(),
							domain: "facebook.com",
							path: "/",
							hostOnly: true,
							creation: new Date().toISOString(),
							lastAccessed: new Date().toISOString()
						};
					})
					.filter(i => i.key && i.value && i.key != "x-referer");
			}
			// is netscape cookie
			else if (isNetScapeCookie(accountText)) {
				spin = createOraDots(getText('login', 'loginCookieNetscape'));
				spin._start();
				appState = netScapeToCookies(accountText);
			}
			else if (
				(splitAccountText.length == 2 || splitAccountText.length == 3) &&
				!splitAccountText.slice(0, 2).map(i => i.trim()).some(i => i.includes(' '))
			) {
				// bug if account.txt is "[]"
				global.GoatBot.config.facebookAccount.email = splitAccountText[0]; // bug here=> email is "["
				global.GoatBot.config.facebookAccount.password = splitAccountText[1]; // bug here=> password is "]"
				if (splitAccountText[2]) {
					const code2FATemp = splitAccountText[2].replace(/ /g, "");
					global.GoatBot.config.facebookAccount['2FASecret'] = code2FATemp;
				}
				writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			}
			// is json (cookies or appstate)
			else {
				try {
					spin = createOraDots(getText('login', 'loginCookieArray'));
					spin._start();
					appState = JSON.parse(accountText);
				}
				catch (err) {
					const error = new Error(`${path.basename(dirAccount)} is invalid`);
					error.name = "ACCOUNT_ERROR";
					throw error;
				}
				if (appState.some(i => i.name))
					appState = appState.map(i => {
						i.key = i.name;
						delete i.name;
						return i;
					});
				else if (!appState.some(i => i.key)) {
					const error = new Error(`${path.basename(dirAccount)} is invalid`);
					error.name = "ACCOUNT_ERROR";
					throw error;
				}
				appState = appState
					.map(item => ({
						...item,
						domain: "facebook.com",
						path: "/",
						hostOnly: false,
						creation: new Date().toISOString(),
						lastAccessed: new Date().toISOString()
					}))
					.filter(i => i.key && i.value && i.key != "x-referer");
			}
			/*if (!await checkLiveCookie(appState.map(i => i.key + "=" + i.value).join("; "), facebookAccount.userAgent)) {
				const error = new Error("Cookie is invalid");
				error.name = "COOKIE_INVALID";
				throw error;
			}*/
		}
	}
	catch (err) {
		spin && spin._stop();
		let {
			email,
			password
		} = facebookAccount;
		if (err.name === "TOKEN_ERROR")
			log.err("LOGIN FACEBOOK", getText('login', 'tokenError', colors.green("EAAAA..."), colors.green(dirAccount)));
		else if (err.name === "COOKIE_INVALID")
			log.err("LOGIN FACEBOOK", getText('login', 'cookieError'));

		if (!email || !password) {
			log.warn("LOGIN FACEBOOK", getText('login', 'cannotFindAccount'));
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			});
			const options = [
				getText('login', 'chooseAccount'),
				getText('login', 'chooseToken'),
				getText('login', 'chooseCookieString'),
				getText('login', 'chooseCookieArray')
			];
			let currentOption = 0;
			await new Promise((resolve) => {
				const character = '>';
				function showOptions() {
					rl.output.write(`\r${options.map((option, index) => index === currentOption ? colors.blueBright(`${character} (${index + 1}) ${option}`) : `  (${index + 1}) ${option}`).join('\n')}\u001B`);
					rl.write('\u001B[?25l');
				}
				rl.input.on('keypress', (_, key) => {
					if (key.name === 'up') {
						currentOption = (currentOption - 1 + options.length) % options.length;
					}
					else if (key.name === 'down') {
						currentOption = (currentOption + 1) % options.length;
					}
					else if (!isNaN(key.name)) {
						const number = parseInt(key.name);
						if (number >= 0 && number <= options.length)
							currentOption = number - 1;
						process.stdout.write('\x1b[1D');
					}
					else if (key.name === 'enter' || key.name === 'return') {
						rl.input.removeAllListeners('keypress');
						rl.close();
						clearLines(options.length + 1);
						showOptions();
						resolve();
					}
					else {
						process.stdout.write('\x1b[1D');
					}

					clearLines(options.length);
					showOptions();
				});
				showOptions();
			});

			rl.write('\u001B[?25h\n'); // show cursor
			clearLines(options.length + 1);
			log.info("LOGIN FACEBOOK", getText('login', 'loginWith', options[currentOption]));

			if (currentOption == 0) {
				email = await input(`${getText('login', 'inputEmail')} `);
				password = await input(`${getText('login', 'inputPassword')} `, true);
				const twoFactorAuth = await input(`${getText('login', 'input2FA')} `);
				facebookAccount.email = email || '';
				facebookAccount.password = password || '';
				facebookAccount['2FASecret'] = twoFactorAuth || '';
				writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			}
			else if (currentOption == 1) {
				const token = await input(getText('login', 'inputToken') + " ");
				writeFileSync(global.client.dirAccount, token);
			}
			else if (currentOption == 2) {
				const cookie = await input(getText('login', 'inputCookieString') + " ");
				writeFileSync(global.client.dirAccount, cookie);
			}
			else {
				const cookie = await input(getText('login', 'inputCookieArray') + " ");
				writeFileSync(global.client.dirAccount, JSON.stringify(JSON.parse(cookie), null, 2));
			}
			return await getAppStateToLogin();
		}

		log.info("LOGIN FACEBOOK", getText('login', 'loginPassword'));
		log.info("ACCOUNT INFO", `Email: ${facebookAccount.email}, I_User: ${facebookAccount.i_user || "(empty)"}`);
		spin = createOraDots(getText('login', 'loginPassword'));
		spin._start();

		try {
			appState = await getAppStateFromEmail(spin, facebookAccount);
			spin._stop();
		}
		catch (err) {
			spin._stop();
			log.err("LOGIN FACEBOOK", getText('login', 'loginError'), err.message, err);
			process.exit();
		}
	}
	return appState;
}

function stopListening(keyListen) {
	keyListen = keyListen || Object.keys(callbackListenTime).pop();
	return new Promise((resolve) => {
		global.GoatBot.fcaApi.stopListening?.(() => {
			if (callbackListenTime[keyListen]) {
				// callbackListenTime[keyListen || Object.keys(callbackListenTime).pop()]("Connection closed by user.");
				callbackListenTime[keyListen] = () => { };
			}
			resolve();
		}) || resolve();
	});
}

// function removeListener(keyListen) {
// 	keyListen = keyListen || Object.keys(callbackListenTime).pop();
// 	if (callbackListenTime[keyListen])
// 		callbackListenTime[keyListen] = () => { };
// }

// --- NEW CODE START ---

const logger = require("../../logger/log.js");
// const getText = global.utils.getText; // Already defined globally
// const fs = require("fs-extra"); // Already required
// const path = require("path"); // Already required
// const axios = require("axios"); // Already required

// Colors for beautiful console output
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	cyan: "\x1b[36m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	red: "\x1b[31m",
	gray: "\x1b[90m",
	white: "\x1b[97m"
};

// Box drawing characters
const box = {
	topLeft: "╔",
	topRight: "╗",
	bottomLeft: "╚",
	bottomRight: "╝",
	horizontal: "═",
	vertical: "║",
	divider: "─"
};

function createBox(content, width = 70) {
	const lines = content.split("\n");
	let result = `${colors.cyan}${box.topLeft}${box.horizontal.repeat(width)}${box.topRight}${colors.reset}\n`;

	lines.forEach(line => {
		// Remove ANSI escape codes for accurate length calculation
		const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, "");
		const padding = width - cleanLine.length;
		result += `${colors.cyan}${box.vertical}${colors.reset} ${line}${" ".repeat(Math.max(0, padding))} ${colors.cyan}${box.vertical}${colors.reset}\n`;
	});

	result += `${colors.cyan}${box.bottomLeft}${box.horizontal.repeat(width)}${box.bottomRight}${colors.reset}`;
	return result;
}

function createDivider(width = 70) {
	return `${colors.gray}${box.divider.repeat(width + 2)}${colors.reset}`;
}

function formatUptime(ms) {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
	if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
	return `${seconds}s`;
}

async function displayBotStats(api, threadsData, usersData) {
	const startTime = Date.now();
	global.GoatBot.startTime = startTime;

	// Fetch data dynamically or use globally available data if populated
	const allThreads = global.db.allThreadData || [];
	const allUsers = global.db.allUserData || [];

	// Count active groups (where bot is still a member)
	const activeGroups = allThreads.filter(thread =>
		thread.isGroup && thread.members.some(m => m.userID == api.getCurrentUserID() && m.inGroup)
	);

	// Count total unique users
	const totalUsers = allUsers.length;

	// Count users in active groups
	const activeUsers = new Set();
	activeGroups.forEach(thread => {
		thread.members.forEach(member => {
			if (member.inGroup) activeUsers.add(member.userID);
		});
	});

	// Bot information
	const botID = api.getCurrentUserID();
	const botInfo = allUsers.find(u => u.userID == botID) || {};
	const botName = botInfo.name || "Instagram Bot"; // Default name if not found

	// Commands and events count
	const commandsCount = global.client.commands.size;
	const eventsCount = global.client.events.size;

	// Memory usage
	const memUsage = process.memoryUsage();
	const memUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
	const memTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);

	console.clear();

	// Banner
	const banner = `
${colors.bright}${colors.cyan}    ██████╗  ██████╗  █████╗ ████████╗██████╗  ██████╗ ████████╗${colors.reset}
${colors.bright}${colors.cyan}   ██╔════╝ ██╔═══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██╗╚══██╔══╝${colors.reset}
${colors.bright}${colors.cyan}   ██║  ███╗██║   ██║███████║   ██║   ██████╔╝██║   ██║   ██║${colors.reset}
${colors.bright}${colors.cyan}   ██║   ██║██║   ██║██╔══██║   ██║   ██╔══██╗██║   ██║   ██║${colors.reset}
${colors.bright}${colors.cyan}   ╚██████╔╝╚██████╔╝██║  ██║   ██║   ██████╔╝╚██████╔╝   ██║${colors.reset}
${colors.bright}${colors.cyan}    ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═════╝  ╚═════╝    ╚═╝${colors.reset}
${colors.gray}                    GoatBot V2 - Instagram Port${colors.reset}
${colors.gray}                        Developer: Gtajisan${colors.reset}
`;

	console.log(banner);
	console.log("\n");

	// Bot Status
	const statusContent = `${colors.bright}${colors.green}● BOT STATUS${colors.reset}
${colors.gray}┌─────────────────────────────────────────────────────────────────┐${colors.reset}
${colors.white}│${colors.reset} ${colors.yellow}Bot Name:${colors.reset}      ${colors.bright}${botName}${colors.reset}
${colors.white}│${colors.reset} ${colors.yellow}Bot ID:${colors.reset}        ${colors.bright}${botID}${colors.reset}
${colors.white}│${colors.reset} ${colors.yellow}Status:${colors.reset}        ${colors.bright}${colors.green}● Online & Running${colors.reset}
${colors.white}│${colors.reset} ${colors.yellow}Platform:${colors.reset}      ${colors.bright}Instagram${colors.reset}
${colors.gray}└─────────────────────────────────────────────────────────────────┘${colors.reset}`;

	console.log(statusContent);
	console.log("\n");

	// Statistics
	const statsContent = `${colors.bright}${colors.blue}📊 STATISTICS${colors.reset}
${colors.gray}┌─────────────────────────────────────────────────────────────────┐${colors.reset}
${colors.white}│${colors.reset} ${colors.cyan}Groups:${colors.reset}
${colors.white}│${colors.reset}   ${colors.gray}├─${colors.reset} ${colors.yellow}Total Groups:${colors.reset}          ${colors.bright}${allThreads.filter(t => t.isGroup).length}${colors.reset}
${colors.white}│${colors.reset}   ${colors.gray}└─${colors.reset} ${colors.green}Active Groups:${colors.reset}         ${colors.bright}${activeGroups.length}${colors.reset}
${colors.white}│${colors.reset}
${colors.white}│${colors.reset} ${colors.cyan}Users:${colors.reset}
${colors.white}│${colors.reset}   ${colors.gray}├─${colors.reset} ${colors.yellow}Total Users:${colors.reset}           ${colors.bright}${totalUsers}${colors.reset}
${colors.white}│${colors.reset}   ${colors.gray}└─${colors.reset} ${colors.green}Active Users:${colors.reset}          ${colors.bright}${activeUsers.size}${colors.reset}
${colors.white}│${colors.reset}
${colors.white}│${colors.reset} ${colors.cyan}Commands & Events:${colors.reset}
${colors.white}│${colors.reset}   ${colors.gray}├─${colors.reset} ${colors.yellow}Commands Loaded:${colors.reset}       ${colors.bright}${commandsCount}${colors.reset}
${colors.white}│${colors.reset}   ${colors.gray}└─${colors.reset} ${colors.yellow}Events Loaded:${colors.reset}         ${colors.bright}${eventsCount}${colors.reset}
${colors.gray}└─────────────────────────────────────────────────────────────────┘${colors.reset}`;

	console.log(statsContent);
	console.log("\n");

	// System Resources
	const resourcesContent = `${colors.bright}${colors.magenta}⚙️  SYSTEM RESOURCES${colors.reset}
${colors.gray}┌─────────────────────────────────────────────────────────────────┐${colors.reset}
${colors.white}│${colors.reset} ${colors.yellow}Memory Usage:${colors.reset}      ${colors.bright}${memUsed}MB${colors.reset} / ${colors.bright}${memTotal}MB${colors.reset}
${colors.white}│${colors.reset} ${colors.yellow}Node Version:${colors.reset}      ${colors.bright}${process.version}${colors.reset}
${colors.white}│${colors.reset} ${colors.yellow}Platform:${colors.reset}          ${colors.bright}${process.platform} (${process.arch})${colors.reset}
${colors.white}│${colors.reset} ${colors.yellow}Prefix:${colors.reset}            ${colors.bright}${global.GoatBot.config.prefix}${colors.reset}
${colors.gray}└─────────────────────────────────────────────────────────────────┘${colors.reset}`;

	console.log(resourcesContent);
	console.log("\n");

	// Footer
	const footer = `${colors.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.bright}${colors.green}✓${colors.reset} ${colors.white}Bot is ready to receive messages!${colors.reset}
${colors.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`;

	console.log(footer);
	console.log("\n");

	// Start uptime display
	setInterval(() => {
		const uptime = Date.now() - startTime;
		const formattedUptime = formatUptime(uptime);
		process.stdout.write(`\r${colors.gray}Uptime:${colors.reset} ${colors.bright}${colors.green}${formattedUptime}${colors.reset} ${colors.gray}|${colors.reset} ${colors.gray}Memory:${colors.reset} ${colors.bright}${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB${colors.reset}`);
	}, 1000);
}

// --- NEW CODE END ---

async function startBot(loginWithEmail) {
	console.log(colors.hex("#f5ab00")(createLine("START LOGGING IN", true)));
	const currentVersion = require("../../package.json").version;
	const tooOldVersion = (await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2-Storage/main/tooOldVersions.txt")).data || "0.0.0";
	// nếu version cũ hơn
	if ([-1, 0].includes(compareVersion(currentVersion, tooOldVersion))) {
		log.err("VERSION", getText('version', 'tooOldVersion', colors.yellowBright('node update')));
		process.exit();
	}
	/* { CHECK ORIGIN CODE } */

	if (global.GoatBot.Listening)
		await stopListening();

	log.info("LOGIN FACEBOOK", getText('login', 'currentlyLogged'));

	let appState = await getAppStateToLogin(loginWithEmail);
	changeFbStateByCode = true;
	appState = filterKeysAppState(appState);
	writeFileSync(dirAccount, JSON.stringify(appState, null, 2));
	setTimeout(() => changeFbStateByCode = false, 1000);
	// ——————————————————— LOGIN ———————————————————— //
	(function loginBot(appState) {
		global.GoatBot.commands = new Map();
		global.GoatBot.eventCommands = new Map();
		global.GoatBot.aliases = new Map();
		global.GoatBot.onChat = [];
		global.GoatBot.onEvent = [];
		global.GoatBot.onReply = new Map();
		global.GoatBot.onReaction = new Map();
		clearInterval(global.intervalRestartListenMqtt);
		delete global.intervalRestartListenMqtt;

		if (facebookAccount.i_user)
			pushI_user(appState, facebookAccount.i_user);

		let isSendNotiErrorMessage = false;

		login({ appState }, global.GoatBot.config.optionsFca, async function (error, api) {
			if (!isNaN(facebookAccount.intervalGetNewCookie) && facebookAccount.intervalGetNewCookie > 0)
				if (facebookAccount.email && facebookAccount.password) {
					spin?._stop();
					log.info("REFRESH COOKIE", getText('login', 'refreshCookieAfter', convertTime(facebookAccount.intervalGetNewCookie * 60 * 1000, true)));
					setTimeout(async function refreshCookie() {
						try {
							log.info("REFRESH COOKIE", getText('login', 'refreshCookie'));
							const appState = await getAppStateFromEmail(undefined, facebookAccount);
							if (facebookAccount.i_user)
								pushI_user(appState, facebookAccount.i_user);
							changeFbStateByCode = true;
							writeFileSync(dirAccount, JSON.stringify(filterKeysAppState(appState), null, 2));
							setTimeout(() => changeFbStateByCode = false, 1000);
							log.info("REFRESH COOKIE", getText('login', 'refreshCookieSuccess'));
							return startBot(appState);
						}
						catch (err) {
							log.err("REFRESH COOKIE", getText('login', 'refreshCookieError'), err.message, err);
							setTimeout(refreshCookie, facebookAccount.intervalGetNewCookie * 60 * 1000);
						}
					}, facebookAccount.intervalGetNewCookie * 60 * 1000);
				}
				else {
					spin?._stop();
					log.warn("REFRESH COOKIE", getText('login', 'refreshCookieWarning'));
				}
			spin ? spin._stop() : null;

			// Handle error
			if (error) {
				log.err("LOGIN FACEBOOK", getText('login', 'loginError'), error);
				global.statusAccountBot = 'can\'t login';
				if (facebookAccount.email && facebookAccount.password) {
					return startBot(true);
				}
				// —————————— CHECK DASHBOARD —————————— //
				if (global.GoatBot.config.dashBoard?.enable == true) {
					try {
						await require("../../dashboard/app.js")(null);
						log.info("DASHBOARD", getText('login', 'openDashboardSuccess'));
					}
					catch (err) {
						log.err("DASHBOARD", getText('login', 'openDashboardError'), err);
					}
					return;
				}
				else {
					process.exit();
				}
			}

			global.GoatBot.fcaApi = api;
			global.GoatBot.botID = api.getCurrentUserID();
			log.info("LOGIN FACEBOOK", getText('login', 'loginSuccess'));
			let hasBanned = false;
			global.botID = api.getCurrentUserID();
			logColor("#f5ab00", createLine("BOT INFO"));
			log.info("NODE VERSION", process.version);
			log.info("PROJECT VERSION", currentVersion);
			log.info("BOT ID", `${global.botID} - ${await getName(global.botID, api)}`);
			log.info("PREFIX", global.GoatBot.config.prefix);
			log.info("LANGUAGE", global.GoatBot.config.language);
			log.info("BOT NICK NAME", global.GoatBot.config.nickNameBot || "GOAT BOT");
			// ———————————————————— GBAN ————————————————————— //
			let dataGban;

			try {
				// convert to promise
				const item = await axios.get("https://raw.githubusercontent.com/Savage-Army/gban/refs/heads/main/gban.json");
				dataGban = item.data;

				// ————————————————— CHECK BOT ————————————————— //
				const botID = api.getCurrentUserID();
				if (dataGban.hasOwnProperty(botID)) {
					if (!dataGban[botID].toDate) {
						log.err('GBAN', getText('login', 'gbanMessage', dataGban[botID].date, dataGban[botID].reason, dataGban[botID].date));
						hasBanned = true;
					}
					else {
						const currentDate = (new Date((await axios.get("http://worldtimeapi.org/api/timezone/UTC")).data.utc_datetime)).getTime();
						if (currentDate < (new Date(dataGban[botID].date)).getTime()) {
							log.err('GBAN', getText('login', 'gbanMessage', dataGban[botID].date, dataGban[botID].reason, dataGban[botID].date, dataGban[botID].toDate));
							hasBanned = true;
						}
					}
				}
				// ———————————————— CHECK ADMIN ———————————————— //
				for (const idad of global.GoatBot.config.adminBot) {
					if (dataGban.hasOwnProperty(idad)) {
						if (!dataGban[idad].toDate) {
							log.err('GBAN', getText('login', 'gbanMessage', dataGban[idad].date, dataGban[idad].reason, dataGban[idad].date));
							hasBanned = true;
						}
						else {
							const currentDate = (new Date((await axios.get("http://worldtimeapi.org/api/timezone/UTC")).data.utc_datetime)).getTime();
							if (currentDate < (new Date(dataGban[idad].date)).getTime()) {
								log.err('GBAN', getText('login', 'gbanMessage', dataGban[idad].date, dataGban[idad].reason, dataGban[idad].date, dataGban[idad].toDate));
								hasBanned = true;
							}
						}
					}
				}
				if (hasBanned == true)
					process.exit();
			}
			catch (e) {
				console.log(e);
				log.err('GBAN', getText('login', 'checkGbanError'));
				process.exit();
			}
			// ———————————————— NOTIFICATIONS ———————————————— //
			let notification;
			try {
				const getNoti = await axios.get("https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2-Gban/master/notification.txt");
				notification = getNoti.data;
			}
			catch (err) {
				log.err("ERROR", "Can't get notifications data");
				process.exit();
			}
			if (global.GoatBot.config.autoRefreshFbstate == true) {
				changeFbStateByCode = true;
				try {
					writeFileSync(dirAccount, JSON.stringify(filterKeysAppState(api.getAppState()), null, 2));
					log.info("REFRESH FBSTATE", getText('login', 'refreshFbstateSuccess', path.basename(dirAccount)));
				}
				catch (err) {
					log.warn("REFRESH FBSTATE", getText('login', 'refreshFbstateError', path.basename(dirAccount)), err);
				}
				setTimeout(() => changeFbStateByCode = false, 1000);
			}
			if (hasBanned == true) {
				log.err('GBAN', getText('login', 'youAreBanned'));
				process.exit();
			}
			// ——————————————————— LOAD DATA ——————————————————— //
			const { threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, sequelize } = await require(process.env.NODE_ENV === 'development' ? "./loadData.dev.js" : "./loadData.js")(api, createLine);
			// ————————————————— CUSTOM SCRIPTS ————————————————— //
			await require("../custom.js")({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getText });
			// —————————————————— LOAD SCRIPTS —————————————————— //
			await require(process.env.NODE_ENV === 'development' ? "./loadScripts.dev.js" : "./loadScripts.js")(api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, createLine);
			// ———————————— CHECK AUTO LOAD SCRIPTS ———————————— //
			if (global.GoatBot.config.autoLoadScripts?.enable == true) {
				const ignoreCmds = global.GoatBot.config.autoLoadScripts.ignoreCmds?.replace(/[ ,]+/g, ' ').trim().split(' ') || [];
				const ignoreEvents = global.GoatBot.config.autoLoadScripts.ignoreEvents?.replace(/[ ,]+/g, ' ').trim().split(' ') || [];

				watch(`${process.cwd()}/scripts/cmds`, async (event, filename) => {
					if (filename.endsWith('.js')) {
						if (ignoreCmds.includes(filename) || filename.endsWith('.eg.js'))
							return;
						if ((event == 'change' || event == 'rename') && existsSync(`${process.cwd()}/scripts/cmds/${filename}`)) {
							try {
								const contentCommand = global.temp.contentScripts.cmds[filename] || "";
								const currentContent = readFileSync(`${process.cwd()}/scripts/cmds/${filename}`, 'utf-8');
								if (contentCommand == currentContent)
									return;
								global.temp.contentScripts.cmds[filename] = currentContent;
								filename = filename.replace('.js', '');

								const infoLoad = global.utils.loadScripts("cmds", filename, log, global.GoatBot.configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData);
								if (infoLoad.status == "success")
									log.master("AUTO LOAD SCRIPTS", `Command ${filename}.js (${infoLoad.command.config.name}) has been reloaded`);
								else
									log.err("AUTO LOAD SCRIPTS", `Error when reload command ${filename}.js`, infoLoad.error);
							}
							catch (err) {
								log.err("AUTO LOAD SCRIPTS", `Error when reload command ${filename}.js`, err);
							}
						}
					}
				});

				watch(`${process.cwd()}/scripts/events`, async (event, filename) => {
					if (filename.endsWith('.js')) {
						if (ignoreEvents.includes(filename) || filename.endsWith('.eg.js'))
							return;
						if ((event == 'change' || event == 'rename') && existsSync(`${process.cwd()}/scripts/events/${filename}`)) {
							try {
								const contentEvent = global.temp.contentScripts.events[filename] || "";
								const currentContent = readFileSync(`${process.cwd()}/scripts/events/${filename}`, 'utf-8');
								if (contentEvent == currentContent)
									return;
								global.temp.contentScripts.events[filename] = currentContent;
								filename = filename.replace('.js', '');

								const infoLoad = global.utils.loadScripts("events", filename, log, global.GoatBot.configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData);
								if (infoLoad.status == "success")
									log.master("AUTO LOAD SCRIPTS", `Event ${filename}.js (${infoLoad.command.config.name}) has been reloaded`);
								else
									log.err("AUTO LOAD SCRIPTS", `Error when reload event ${filename}.js`, infoLoad.error);
							}
							catch (err) {
								log.err("AUTO LOAD SCRIPTS", `Error when reload event ${filename}.js`, err);
							}
						}
					}
				});
			}
			// ——————————————————— DASHBOARD ——————————————————— //
			if (global.GoatBot.config.dashBoard?.enable == true && dashBoardIsRunning == false) {
				logColor('#f5ab00', createLine('DASHBOARD'));
				try {
					await require("../../dashboard/app.js")(api);
					log.info("DASHBOARD", getText('login', 'openDashboardSuccess'));
					dashBoardIsRunning = true;
				}
				catch (err) {
					log.err("DASHBOARD", getText('login', 'openDashboardError'), err);
				}
			}
			// ———————————————————— ADMIN BOT ———————————————————— //
			logColor('#f5ab00', character);
			let i = 0;
			const adminBot = global.GoatBot.config.adminBot
				.filter(item => !isNaN(item))
				.map(item => item = item.toString());
			for (const uid of adminBot) {
				try {
					const userName = await usersData.getName(uid);
					log.master("ADMINBOT", `[${++i}] ${uid} | ${userName}`);
				}
				catch (e) {
					log.master("ADMINBOT", `[${++i}] ${uid}`);
				}
			}
			log.master("NOTIFICATION", (notification || "").trim());
			log.master("SUCCESS", getText('login', 'runBot'));
			log.master("LOAD TIME", `${convertTime(Date.now() - global.GoatBot.startTime)}`);
			logColor("#f5ab00", createLine("COPYRIGHT"));
			// —————————————————— COPYRIGHT INFO —————————————————— //
			// console.log(`\x1b[1m\x1b[33mCOPYRIGHT:\x1b[0m\x1b[1m\x1b[37m \x1b[0m\x1b[1m\x1b[36mProject GoatBot v2 created by ntkhang03 (https://github.com/ntkhang03), please do not sell this source code or claim it as your own. Thank you!\x1b[0m`);
			console.log(`\x1b[1m\x1b[33m${("COPYRIGHT:")}\x1b[0m\x1b[1m\x1b[37m \x1b[0m\x1b[1m\x1b[36m${("Project GoatBot v2 created by ntkhang03 (https://github.com/ntkhang03), please do not sell this source code or claim it as your own. Thank you!")}\x1b[0m`);
			logColor("#f5ab00", character);
			global.GoatBot.config.adminBot = adminBot;
			writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			writeFileSync(global.client.dirConfigCommands, JSON.stringify(global.GoatBot.configCommands, null, 2));

			// ——————————————————————————————————————————————————— //
			const { restartListenMqtt } = global.GoatBot.config;
			let intervalCheckLiveCookieAndRelogin = false;
			// —————————————————— CALLBACK LISTEN —————————————————— //
			async function callBackListen(error, event) {
				if (error) {
					global.responseUptimeCurrent = responseUptimeError;
					if (
						error.error == "Not logged in" ||
						error.error == "Not logged in." ||
						error.error == "Connection refused: Server unavailable"
					) {
						log.err("NOT LOGGEG IN", getText('login', 'notLoggedIn'), error);
						global.responseUptimeCurrent = responseUptimeError;
						global.statusAccountBot = 'can\'t login';
						if (!isSendNotiErrorMessage) {
							await handlerWhenListenHasError({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, error });
							isSendNotiErrorMessage = true;
						}

						if (global.GoatBot.config.autoRestartWhenListenMqttError)
							process.exit(2);
						else {
							// log.dev("ACCOUNT LOCKED, start relogin...");
							// await stopListening();
							// log.dev("STOP LISTENING SUCCESS");
							const keyListen = Object.keys(callbackListenTime).pop();
							if (callbackListenTime[keyListen])
								callbackListenTime[keyListen] = () => { };
							const cookieString = appState.map(i => i.key + "=" + i.value).join("; ");
							// log.dev("GET COOKIE SUCCESS");
							// log.dev(cookieString);

							let times = 5;

							const spin = createOraDots(getText('login', 'retryCheckLiveCookie', times));
							const countTimes = setInterval(() => {
								times--;
								if (times == 0)
									times = 5;
								spin.text = getText('login', 'retryCheckLiveCookie', times);
							}, 1000);

							if (intervalCheckLiveCookieAndRelogin == false) {
								intervalCheckLiveCookieAndRelogin = true;
								const interval = setInterval(async () => {
									const cookieIsLive = await checkLiveCookie(cookieString, facebookAccount.userAgent);
									if (cookieIsLive) {
										clearInterval(interval);
										clearInterval(countTimes);
										intervalCheckLiveCookieAndRelogin = false;
										const keyListen = Date.now();
										isSendNotiErrorMessage = false;
										global.GoatBot.Listening = api.listenMqtt(createCallBackListen(keyListen));
									}
								}, 5000);
							}
						}
						return;
					}
					else if (error == "Connection closed." || error == "Connection closed by user.") /* by stopListening; */ {
						return;
					}
					else {
						await handlerWhenListenHasError({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, error });
						return log.err("LISTEN_MQTT", getText('login', 'callBackError'), error);
					}
				}
				global.responseUptimeCurrent = responseUptimeSuccess;
				global.statusAccountBot = 'good';
				const configLog = global.GoatBot.config.logEvents;
				if (isSendNotiErrorMessage == true)
					isSendNotiErrorMessage = false;

				// "whiteListMode": {
				// 	"enable": false,
				// 	"whiteListIds": [],
				// 	"notes": "if you enable this feature, only the ids in the whiteListIds list can use the bot"
				// },
				// "whiteListModeThread": {
				// 	"enable": false,
				// 	"whiteListThreadIds": [],
				// 	"notes": "if you enable this feature, only the thread in the whiteListThreadIds list can use the bot",
				// 	"how_it_work": "if you enable both whiteListMode and whiteListModeThread, the system will check if the user is in whiteListIds, then check if the thread is in whiteListThreadIds, if one of the conditions is true, the user can use the bot"
				// },

				// "if you enable both whiteListMode and whiteListModeThread, the system will check if the user is in whiteListIds, then check if the thread is in whiteListThreadIds, if one of the conditions is true, the user can use the bot"
				// const whitelistMode = config.whiteListMode?.enable === true;
				// const whitelistModeThread = config.whiteListModeThread?.enable === true;
				// const isWhitelistedSender = config.whiteListMode?.whiteListIds.includes(event.senderID);
				// const isWhitelistedThread = config.whiteListModeThread?.whiteListThreadIds.includes(event.threadID);

				// if (
				// 	(whitelistMode && whitelistModeThread && !isWhitelistedSender && !isWhitelistedThread) ||
				// 	(whitelistMode && !isWhitelistedSender) ||
				// 	(whitelistModeThread && !isWhitelistedThread)
				// ) {
				// 	return;
				// }

				if (
					global.GoatBot.config.whiteListMode?.enable == true
					&& global.GoatBot.config.whiteListModeThread?.enable == true
					// admin
					&& !global.GoatBot.config.adminBot.includes(event.senderID)
				) {
					if (
						!global.GoatBot.config.whiteListMode.whiteListIds.includes(event.senderID)
						&& !global.GoatBot.config.whiteListModeThread.whiteListThreadIds.includes(event.threadID)
						// admin
						&& !global.GoatBot.config.adminBot.includes(event.senderID)
					)
						return;
				}
				else if (
					global.GoatBot.config.whiteListMode?.enable == true
					&& !global.GoatBot.config.whiteListMode.whiteListIds.includes(event.senderID)
					// admin
					&& !global.GoatBot.config.adminBot.includes(event.senderID)
				)
					return;
				else if (
					global.GoatBot.config.whiteListModeThread?.enable == true
					&& !global.GoatBot.config.whiteListModeThread.whiteListThreadIds.includes(event.threadID)
					// admin
					&& !global.GoatBot.config.adminBot.includes(event.senderID)
				)
					return;

				// check if listenMqtt loop
				if (event.messageID && event.type == "message") {
					if (storage5Message.includes(event.messageID))
						Object.keys(callbackListenTime).slice(0, -1).forEach(key => {
							callbackListenTime[key] = () => { };
						});
					else
						storage5Message.push(event.messageID);
					if (storage5Message.length > 5)
						storage5Message.shift();
				}

				if (configLog.disableAll === false && configLog[event.type] !== false) {
					// hide participantIDs (it is array too long)
					const participantIDs_ = [...event.participantIDs || []];
					if (event.participantIDs)
						event.participantIDs = 'Array(' + event.participantIDs.length + ')';

					console.log(colors.green((event.type || "").toUpperCase() + ":"), jsonStringifyColor(event, null, 2));

					if (event.participantIDs)
						event.participantIDs = participantIDs_;
				}

				if ((event.senderID && dataGban[event.senderID] || event.userID && dataGban[event.userID])) {
					if (event.body && event.threadID) {
						const prefix = getPrefix(event.threadID);
						if (event.body.startsWith(prefix))
							return api.sendMessage(getText('login', 'userBanned'), event.threadID);
						return;
					}
					else
						return;
				}

				const handlerAction = require("../handler/handlerAction.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

				if (hasBanned === false)
					handlerAction(event);
				else
					return log.err('GBAN', getText('login', 'youAreBanned'));
			}
			// ————————————————— CREATE CALLBACK ————————————————— //
			function createCallBackListen(key) {
				key = randomString(10) + (key || Date.now());
				callbackListenTime[key] = callBackListen;
				return function (error, event) {
					callbackListenTime[key](error, event);
				};
			}
			// ———————————————————— START BOT ———————————————————— //
			await stopListening();
			global.GoatBot.Listening = api.listenMqtt(createCallBackListen());
			global.GoatBot.callBackListen = callBackListen;
			// ——————————————————— UPTIME ——————————————————— //
			if (global.GoatBot.config.serverUptime.enable == true && !global.GoatBot.config.dashBoard?.enable && !global.serverUptimeRunning) {
				const http = require('http');
				const express = require('express');
				const app = express();
				const server = http.createServer(app);
				const { data: html } = await axios.get("https://raw.githubusercontent.com/ntkhang03/resources-goat-bot/master/homepage/home.html");
				const PORT = global.GoatBot.config.dashBoard?.port || (!isNaN(global.GoatBot.config.serverUptime.port) && global.GoatBot.config.serverUptime.port) || 3001;
				app.get('/', (req, res) => res.send(html));
				app.get('/uptime', global.responseUptimeCurrent);
				let nameUpTime;
				try {
					nameUpTime = `https://${process.env.REPL_OWNER ?
						`${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` :
						process.env.API_SERVER_EXTERNAL == "https://api.glitch.com" ?
							`${process.env.PROJECT_DOMAIN}.glitch.me` :
							`localhost:${PORT}`}`;
					nameUpTime.includes('localhost') && (nameUpTime = nameUpTime.replace('https', 'http'));
					await server.listen(PORT);
					log.info("UPTIME", getText('login', 'openServerUptimeSuccess', nameUpTime));
					if (global.GoatBot.config.serverUptime.socket?.enable == true)
						require('./socketIO.js')(server);
					global.serverUptimeRunning = true;
				}
				catch (err) {
					log.err("UPTIME", getText('login', 'openServerUptimeError'), err);
				}
			}


			// ———————————————————— RESTART LISTEN ———————————————————— //
			if (restartListenMqtt.enable == true) {
				if (restartListenMqtt.logNoti == true) {
					log.info("LISTEN_MQTT", getText('login', 'restartListenMessage', convertTime(restartListenMqtt.timeRestart, true)));
					log.info("BOT_STARTED", getText('login', 'startBotSuccess'));

					logColor("#f5ab00", character);
				}
				const restart = setInterval(async function () {
					if (restartListenMqtt.enable == false) {
						clearInterval(restart);
						return log.warn("LISTEN_MQTT", getText('login', 'stopRestartListenMessage'));
					}
					try {
						await stopListening();
						await sleep(1000);
						global.GoatBot.Listening = api.listenMqtt(createCallBackListen());
						log.info("LISTEN_MQTT", getText('login', 'restartListenMessage2'));
					}
					catch (e) {
						log.err("LISTEN_MQTT", getText('login', 'restartListenMessageError'), e);
					}
				}, restartListenMqtt.timeRestart);
				global.intervalRestartListenMqtt = restart;
			}
			require('../autoUptime.js');
		});
	})(appState);

	if (global.GoatBot.config.autoReloginWhenChangeAccount) {
		setTimeout(function () {
			watch(dirAccount, async (type) => {
				if (type == 'change' && changeFbStateByCode == false && latestChangeContentAccount != fs.statSync(dirAccount).mtimeMs) {
					clearInterval(global.intervalRestartListenMqtt);
					global.compulsoryStopLisening = true;
					// await stopListening();
					latestChangeContentAccount = fs.statSync(dirAccount).mtimeMs;
					// process.exit(2);
					startBot();
				}
			});
		}, 10000);
	}
}

global.GoatBot.reLoginBot = startBot;
startBot();

module.exports = async function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	// Original login code continues here...
	const { config } = global.GoatBot;
	const { userNameBot, password } = config.credentials.facebookAccount;

	// Display bot stats after successful login
	displayBotStats(api, threadsData, usersData);

	return api;
};