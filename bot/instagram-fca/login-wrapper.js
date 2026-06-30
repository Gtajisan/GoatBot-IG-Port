'use strict';

const login = require('./index');
const fs = require('fs-extra');
const logger = require('../../utils/logger');

/**
 * Standardized login for Instagram-FCA.
 * Supports Netscape HTTP Cookie File format directly.
 */
async function loginFca(credentials, options = {}) {
    try {
        let loginPayload = {};

        if (typeof credentials === 'string') {
            if (credentials.includes('# Netscape HTTP Cookie File')) {
                const appState = parseNetscape(credentials);
                loginPayload = { appState };
            } else {
                try {
                    const parsed = JSON.parse(credentials);
                    loginPayload = parsed.appState ? parsed : { appState: parsed };
                } catch (e) {
                    throw new Error('Invalid credentials format: expected Netscape or JSON string');
                }
            }
        } else if (Array.isArray(credentials)) {
            loginPayload = { appState: credentials };
        } else {
            loginPayload = credentials;
        }

        const api = await login(loginPayload, options);
        logger.info('Instagram-FCA login successful');
        return api;
    } catch (error) {
        logger.error('Instagram-FCA login failed', { error: error.message });
        throw error;
    }
}

function parseNetscape(content) {
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
            name: parts[5],
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

module.exports = loginFca;
