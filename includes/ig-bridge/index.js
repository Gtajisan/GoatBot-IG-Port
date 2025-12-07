
/**
 * ig-bridge/index.js
 * Bridge between Python Instagram Realtime Client and Node.js GoatBot handlers
 */

const { PythonShell } = require('python-shell');
const MessageHandler = require('../handlers/MessageHandler');
const EventHandler = require('../handlers/EventHandler');
const path = require('path');

class IGBridge {
    constructor(config, commands, events, database) {
        this.config = config;
        this.commands = commands;
        this.events = events;
        this.database = database;
        this.pythonShell = null;
        this.messageHandler = new MessageHandler(config, commands, database);
        this.eventHandler = new EventHandler(config, events, database);
        
        this.setupHandlers();
    }

    setupHandlers() {
        // Forward send message requests to Python
        this.messageHandler.on('sendMessage', (data) => {
            this.sendToPython({ action: 'send_message', ...data });
        });

        this.messageHandler.on('react', (data) => {
            this.sendToPython({ action: 'react', ...data });
        });

        this.eventHandler.on('sendMessage', (data) => {
            this.sendToPython({ action: 'send_message', ...data });
        });

        // Forward logs to dashboard
        this.messageHandler.on('log', (data) => {
            console.log('[LOG]', JSON.stringify(data, null, 2));
        });
    }

    sendToPython(data) {
        if (this.pythonShell) {
            this.pythonShell.send(JSON.stringify(data));
        }
    }

    start() {
        return new Promise((resolve, reject) => {
            const options = {
                mode: 'json',
                pythonPath: 'python3',
                pythonOptions: ['-u'],
                scriptPath: path.join(__dirname, '../ig-realtime'),
                args: [
                    this.config.igUsername || process.env.IG_USERNAME,
                    this.config.igPassword || process.env.IG_PASSWORD
                ]
            };

            this.pythonShell = new PythonShell('bridge_server.py', options);

            this.pythonShell.on('message', (message) => {
                this.handlePythonMessage(message);
            });

            this.pythonShell.on('error', (err) => {
                console.error('[IG-BRIDGE] Python error:', err);
            });

            this.pythonShell.on('close', () => {
                console.log('[IG-BRIDGE] Python process closed');
                // Auto-restart
                setTimeout(() => {
                    console.log('[IG-BRIDGE] Restarting Python client...');
                    this.start();
                }, 5000);
            });

            // Wait for ready signal
            const readyListener = (msg) => {
                if (msg.status === 'ready') {
                    console.log('[IG-BRIDGE] Instagram client ready');
                    this.pythonShell.removeListener('message', readyListener);
                    resolve();
                }
            };

            this.pythonShell.on('message', readyListener);

            setTimeout(() => {
                reject(new Error('Instagram client timeout'));
            }, 30000);
        });
    }

    handlePythonMessage(message) {
        try {
            if (message.type === 'message') {
                this.messageHandler.handleMessage(message.data);
            } else if (message.type === 'event') {
                this.eventHandler.handleEvent(message.data);
            } else if (message.status) {
                console.log(`[IG-BRIDGE] Status: ${message.status}`);
            }
        } catch (error) {
            console.error('[IG-BRIDGE] Handle message error:', error);
        }
    }

    stop() {
        if (this.pythonShell) {
            this.pythonShell.terminate();
        }
    }
}

module.exports = IGBridge;
