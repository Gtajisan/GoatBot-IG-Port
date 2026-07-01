'use strict';

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { generateMessageID } = require('../../utils');

async function sendVideoFromUrl(threadID, url, callback) {
    try {
        const tempPath = path.join(process.cwd(), 'temp', `video_${Date.now()}.${url.split('.').pop().split('?')[0] || 'mp4'}`);
        await fs.ensureDir(path.dirname(tempPath));

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        const result = await this.sendVideo(tempPath, threadID);

        // Cleanup
        fs.remove(tempPath).catch(() => {});

        if (callback) callback(null, result);
        return result;
    } catch (error) {
        if (callback) callback(error);
        throw error;
    }
}

module.exports = sendVideoFromUrl;
