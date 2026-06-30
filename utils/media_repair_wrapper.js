const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const logger = require('./logger');

async function repairMedia(type, inputPath, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'media_repair.py');
        const args = [
            pythonScript,
            '--type', type,
            '--input', inputPath,
            '--output', outputPath
        ];

        if (options.audio) {
            args.push('--audio', options.audio);
        }
        if (options.thumbnail) {
            args.push('--thumbnail', options.thumbnail);
        }

        execFile('python3', args, (error, stdout, stderr) => {
            if (error) {
                logger.error('Media repair script failed', { error: error.message, stderr });
                return reject(error);
            }
            try {
                const result = JSON.parse(stdout);
                if (result.status === 'success') {
                    resolve(result);
                } else {
                    logger.error('Media repair logic error', { result });
                    reject(new Error(result.message || 'Unknown media repair error'));
                }
            } catch (e) {
                logger.error('Failed to parse media repair output', { stdout, stderr });
                reject(new Error('Invalid output from media repair script'));
            }
        });
    });
}

module.exports = { repairMedia };
