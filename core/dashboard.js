
const express = require('express');
const path = require('path');
const logger = require('../utils/logger');

class Dashboard {
    constructor() {
        this.app = express();
        this.server = null;
    }
    
    async start(port) {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // Dashboard routes
        this.app.get('/', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>GoatBot Instagram Dashboard</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            max-width: 1200px;
                            margin: 0 auto;
                            padding: 20px;
                            background: #1a1a2e;
                            color: #eee;
                        }
                        h1 { color: #0f3; }
                        .status {
                            background: #16213e;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }
                        .stat {
                            display: inline-block;
                            margin: 10px 20px;
                        }
                        .stat span {
                            color: #0f3;
                            font-size: 24px;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <h1>🐐 GoatBot Instagram Dashboard</h1>
                    <div class="status">
                        <h2>Bot Status: <span style="color: #0f3">Online</span></h2>
                        <div class="stat">
                            <div>Commands Loaded</div>
                            <span id="commands">-</span>
                        </div>
                        <div class="stat">
                            <div>Events Loaded</div>
                            <span id="events">-</span>
                        </div>
                        <div class="stat">
                            <div>Uptime</div>
                            <span id="uptime">-</span>
                        </div>
                    </div>
                    <script>
                        setInterval(() => {
                            fetch('/api/stats')
                                .then(r => r.json())
                                .then(data => {
                                    document.getElementById('commands').textContent = data.commands;
                                    document.getElementById('events').textContent = data.events;
                                    document.getElementById('uptime').textContent = data.uptime;
                                });
                        }, 1000);
                    </script>
                </body>
                </html>
            `);
        });
        
        this.app.get('/api/stats', (req, res) => {
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            
            res.json({
                commands: global.handler?.commands?.size || 0,
                events: global.handler?.events?.size || 0,
                uptime: `${hours}h ${minutes}m ${seconds}s`
            });
        });
        
        this.server = this.app.listen(port, '0.0.0.0', () => {
            logger.success(`Dashboard running on http://0.0.0.0:${port}`);
        });
    }
}

module.exports = new Dashboard();
