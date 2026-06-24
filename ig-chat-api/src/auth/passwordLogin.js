"use strict";

/**
 * Instagram Password Login Module
 * Uses Instagram's private mobile API — same approach as instagrapi
 *
 * Flow:
 *   1. Generate stable device fingerprint
 *   2. Fetch CSRF token from /api/v1/si/fetch_headers/
 *   3. POST /api/v1/accounts/login/ with enc_password
 *   4. Handle: two_factor_required, checkpoint_required, ok
 *   5. Return session cookies + user info
 */

const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const crypto = require("crypto");
const readline = require("readline");

const MOBILE_UA =
    "Instagram 269.0.0.18.75 Android (26/8.0.0; 480dpi; 1080x1920; OnePlus; 6T Dev; devitron; qcom; en_US; 314665256)";

const IG_SIG_KEY = "9193488027538fd3450b83b7d05286d4ca9599a4f2d7dce69ae7f82"; // public key from IG apk
const IG_SIG_KEY_VERSION = "4";
const IG_APP_ID = "567067343352427";
const IG_BASE = "https://i.instagram.com";

function generateDeviceID(seed) {
    const hash = crypto.createHash("md5").update(seed).digest("hex");
    return "android-" + hash.slice(0, 16);
}

function generateUUID(seed) {
    const hash = crypto.createHash("md5").update(seed).digest("hex");
    return [
        hash.slice(0, 8),
        hash.slice(8, 12),
        "4" + hash.slice(13, 16),
        ((parseInt(hash[16], 16) & 3) | 8).toString(16) + hash.slice(17, 20),
        hash.slice(20, 32)
    ].join("-");
}

function generatePhoneID(seed) {
    return generateUUID(seed + "phone");
}

function signData(data) {
    const payload = JSON.stringify(data);
    const sig = crypto.createHmac("sha256", IG_SIG_KEY).update(payload).digest("hex");
    return {
        ig_sig_key_version: IG_SIG_KEY_VERSION,
        signed_body: `${sig}.${payload}`
    };
}

function buildMobileHeaders(ctx) {
    return {
        "User-Agent": MOBILE_UA,
        "Accept-Language": "en-US",
        "Accept-Encoding": "gzip, deflate",
        "X-IG-App-ID": IG_APP_ID,
        "X-IG-Device-ID": ctx.deviceID || "",
        "X-IG-Android-ID": ctx.androidID || "",
        "X-IG-Connection-Type": "WIFI",
        "X-IG-Capabilities": "3brTvwE=",
        "X-IG-App-Locale": "en_US",
        "X-IG-Device-Locale": "en_US",
        "X-Pigeon-Session-Id": ctx.pigeonSessionID || "",
        "X-Pigeon-Rawclienttime": (Date.now() / 1000).toFixed(3),
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "*/*",
        "Connection": "close"
    };
}

function buildEncPassword(password) {
    const ts = Math.floor(Date.now() / 1000);
    return `#PWD_INSTAGRAM_BROWSER:0:${ts}:${password}`;
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function prompt(question) {
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function passwordLogin(username, password, savedSession, log) {
    const logger = log || {
        info: (t, m) => console.log(`[${t}] ${m}`),
        error: (t, m) => console.error(`[${t}] ${m}`),
        warn: (t, m) => console.warn(`[${t}] ${m}`),
        success: (t, m) => console.log(`[${t}] ✓ ${m}`)
    };

    const seed = `${username}_goatbot_ig_2024`;

    // Reuse identifiers if available in savedSession to maintain consistency
    const deviceID = savedSession?.deviceID || generateDeviceID(seed);
    const phoneID  = savedSession?.phoneID || generatePhoneID(seed);
    const uuid     = savedSession?.uuid || generateUUID(seed + "_uuid");
    const androidID = savedSession?.androidID || ("android-" + crypto.createHash("md5").update(seed).digest("hex").slice(0, 15));

    const pigeonSessionID = generateUUID(seed + "_pigeon");

    const jar = new CookieJar();

    const ctx = {
        deviceID,
        androidID,
        phoneID,
        uuid,
        pigeonSessionID,
        csrfToken: "",
        userID: "",
        username: "",
        jar
    };

    const http = wrapper(axios.create({
        jar,
        baseURL: IG_BASE,
        timeout: 30000,
        withCredentials: true,
        headers: buildMobileHeaders(ctx)
    }));

    function extractCookies() {
        const all = jar.toJSON().cookies || [];
        return all.map(c => ({
            key: c.key,
            value: c.value,
            domain: c.domain || ".instagram.com",
            path: c.path || "/",
            hostOnly: c.hostOnly || false,
            creation: c.creation || new Date().toISOString(),
            lastAccessed: c.lastAccessed || new Date().toISOString()
        })).filter(c => c.key && c.value);
    }

    function getCookie(name) {
        const all = jar.toJSON().cookies || [];
        const c = all.find(x => x.key === name);
        return c ? c.value : "";
    }

    async function fetchCSRF() {
        try {
            await http.get("/api/v1/si/fetch_headers/", {
                params: { challenge_type: "signup", guid: uuid },
                headers: buildMobileHeaders(ctx)
            });
        } catch (e) {
        }
        ctx.csrfToken = getCookie("csrftoken");
    }

    async function doLogin() {
        const encPassword = buildEncPassword(password);
        const payload = new URLSearchParams({
            username,
            enc_password: encPassword,
            guid: uuid,
            phone_id: phoneID,
            _csrftoken: ctx.csrfToken || "missing",
            device_id: deviceID,
            adid: "",
            google_tokens: "[]",
            login_attempt_count: "0",
            country_codes: JSON.stringify([{ country_code: "1", source: "default" }]),
            jazoest: "22387"
        }).toString();

        return http.post("/api/v1/accounts/login/", payload, {
            headers: {
                ...buildMobileHeaders(ctx),
                "X-CSRFToken": ctx.csrfToken || "missing"
            }
        });
    }

    async function handleTwoFactor(twoFactorInfo, identifier) {
        logger.warn("LOGIN", "Two-factor authentication required!");
        logger.info("LOGIN", `2FA method: ${twoFactorInfo.two_factor_identifier ? "App/SMS" : "Unknown"}`);

        let code;
        if (process.stdin.isTTY) {
            code = await prompt("Enter your 2FA code: ");
        } else {
            const env2fa = process.env.IG_2FA_CODE || "";
            if (env2fa) {
                code = env2fa;
                logger.info("LOGIN", "Using IG_2FA_CODE from environment variable");
            } else {
                throw new Error("Two-factor authentication required. Set IG_2FA_CODE environment variable or run interactively.");
            }
        }

        const payload = new URLSearchParams({
            _csrftoken: ctx.csrfToken,
            two_factor_identifier: twoFactorInfo.two_factor_identifier,
            username,
            verificationCode: code.replace(/\s/g, ""),
            identifier,
            device_id: deviceID,
            guid: uuid,
            phone_id: phoneID
        }).toString();

        return http.post("/api/v1/accounts/two_factor_login/", payload, {
            headers: {
                ...buildMobileHeaders(ctx),
                "X-CSRFToken": ctx.csrfToken
            }
        });
    }

    async function handleCheckpoint(checkpointUrl) {
        logger.warn("LOGIN", `Checkpoint required: ${checkpointUrl}`);
        logger.warn("LOGIN", "Instagram requires you to verify your account.");
        logger.warn("LOGIN", "Options:");
        logger.warn("LOGIN", "  1. Open Instagram on your phone and approve the login");
        logger.warn("LOGIN", "  2. Check your email/SMS for a verification code");
        logger.warn("LOGIN", "  3. Set IG_CHECKPOINT_CODE env var with the code received");

        const fullUrl = checkpointUrl.startsWith("http") ? checkpointUrl : `https://i.instagram.com${checkpointUrl}`;

        try {
            await http.get(fullUrl, { headers: buildMobileHeaders(ctx) });
        } catch (e) {}

        let code;
        if (process.stdin.isTTY) {
            code = await prompt("Enter checkpoint verification code (or press Enter to skip): ");
        } else {
            code = process.env.IG_CHECKPOINT_CODE || "";
        }

        if (!code) {
            throw new Error("Checkpoint required. Approve the login on your phone then restart, or set IG_CHECKPOINT_CODE env var.");
        }

        const payload = new URLSearchParams({
            security_code: code.replace(/\s/g, ""),
            _csrftoken: ctx.csrfToken
        }).toString();

        return http.post(`${fullUrl}`, payload, {
            headers: {
                ...buildMobileHeaders(ctx),
                "X-CSRFToken": ctx.csrfToken,
                "Referer": fullUrl
            }
        });
    }

    logger.info("LOGIN", `Attempting password login for @${username}...`);

    await fetchCSRF();

    let loginResp;
    try {
        loginResp = await doLogin();
    } catch (err) {
        const status = err.response?.status;
        const data = err.response?.data || {};

        if (status === 400) {
            if (data.two_factor_required) {
                try {
                    loginResp = await handleTwoFactor(data.two_factor_info, data.two_factor_info?.two_factor_identifier);
                } catch (tfErr) {
                    throw new Error(`2FA failed: ${tfErr.message}`);
                }
            } else if (data.checkpoint_url) {
                try {
                    loginResp = await handleCheckpoint(data.checkpoint_url);
                } catch (cpErr) {
                    throw new Error(`Checkpoint failed: ${cpErr.message}`);
                }
            } else if (data.message === "challenge_required") {
                const challengeUrl = data.challenge?.url || "";
                try {
                    loginResp = await handleCheckpoint(challengeUrl);
                } catch (cpErr) {
                    throw new Error(`Challenge failed: ${cpErr.message}`);
                }
            } else {
                const msg = data.message || data.error_type || "Unknown login error";
                throw new Error(`Login failed: ${msg}`);
            }
        } else if (status === 429) {
            throw new Error("Rate limited by Instagram. Wait a few minutes before retrying.");
        } else {
            throw new Error(`Login request failed (HTTP ${status || "?"}): ${err.message}`);
        }
    }

    const user = loginResp?.data?.logged_in_user || loginResp?.data?.user;
    if (!user) {
        throw new Error("Login response did not contain user info. Cookies may still be valid.");
    }

    ctx.userID = (user.pk || user.id || "").toString();
    ctx.username = user.username || username;
    ctx.csrfToken = getCookie("csrftoken") || ctx.csrfToken;

    const appState = extractCookies();

    logger.success("LOGIN", `Password login successful — @${ctx.username} (ID: ${ctx.userID})`);

    return {
        userID: ctx.userID,
        username: ctx.username,
        csrfToken: ctx.csrfToken,
        sessionID: getCookie("sessionid"),
        appState,
        jar,
        deviceID,
        androidID,
        phoneID,
        uuid,
        pigeonSessionID
    };
}

module.exports = { passwordLogin, generateDeviceID, generateUUID };
