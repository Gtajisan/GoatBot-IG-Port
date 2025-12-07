
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const login = require('./core/login');
const dashboard = require('./core/dashboard');
const logger = require('./utils/logger');

const config = require('./config.json');

async function startBot() {
    try {
        logger.info('Starting Instagram GoatBot V2 Port...');
        
        // Initialize database
        await fs.ensureDir(path.join(__dirname, 'database'));
        await fs.ensureDir(path.join(__dirname, 'commands'));
        await fs.ensureDir(path.join(__dirname, 'events'));
        await fs.ensureDir(path.join(__dirname, 'scripts'));
        
        // Load accounts from account.txt
        const accountData = await fs.readFile(path.join(__dirname, 'account.txt'), 'utf8');
        const accounts = JSON.parse(accountData);
        
        if (accounts.length === 0) {
            logger.warn('No accounts found in account.txt. Please add account cookies.');
            process.exit(1);
        }
        
        // Start dashboard if enabled
        if (config.dashboard.enabled) {
            await dashboard.start(config.dashboard.port);
            logger.success(`Dashboard started on http://0.0.0.0:${config.dashboard.port}`);
        }
        
        // Login to all accounts
        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            logger.info(`Logging in to account ${i + 1}/${accounts.length}...`);
            
            try {
                const api = await login(account, config);
                logger.success(`Account ${i + 1} logged in successfully`);
                
                // Load handlers and commands
                const handler = require('./core/handler');
                await handler.initialize(api, config);
                
            } catch (error) {
                logger.error(`Failed to login account ${i + 1}: ${error.message}`);
            }
        }
        
    } catch (error) {
        logger.error('Fatal error during bot startup:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...');
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
});

startBot();
