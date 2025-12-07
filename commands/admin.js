
module.exports = {
    config: {
        name: 'admin',
        aliases: ['admins'],
        description: 'Manage bot administrators',
        usage: '[add|remove|list] [userID]',
        cooldown: 5,
        role: 2
    },
    
    async run({ api, message, args, config }) {
        const fs = require('fs-extra');
        const path = require('path');
        
        const action = args[0]?.toLowerCase();
        
        if (action === 'add') {
            const userId = args[1];
            if (!userId) {
                await api.sendMessage(message.threadID, '❌ Please provide a user ID.');
                return;
            }
            
            if (config.adminUIDs.includes(userId)) {
                await api.sendMessage(message.threadID, '❌ User is already an admin.');
                return;
            }
            
            config.adminUIDs.push(userId);
            await fs.writeFile(path.join(__dirname, '../config.json'), JSON.stringify(config, null, 2));
            await api.sendMessage(message.threadID, `✅ Added ${userId} as admin.`);
            
        } else if (action === 'remove') {
            const userId = args[1];
            if (!userId) {
                await api.sendMessage(message.threadID, '❌ Please provide a user ID.');
                return;
            }
            
            const index = config.adminUIDs.indexOf(userId);
            if (index === -1) {
                await api.sendMessage(message.threadID, '❌ User is not an admin.');
                return;
            }
            
            config.adminUIDs.splice(index, 1);
            await fs.writeFile(path.join(__dirname, '../config.json'), JSON.stringify(config, null, 2));
            await api.sendMessage(message.threadID, `✅ Removed ${userId} from admins.`);
            
        } else if (action === 'list') {
            if (config.adminUIDs.length === 0) {
                await api.sendMessage(message.threadID, '📋 No admins configured.');
                return;
            }
            
            let adminList = '👥 Bot Administrators:\n\n';
            for (const uid of config.adminUIDs) {
                adminList += `• ${uid}\n`;
            }
            
            await api.sendMessage(message.threadID, adminList);
            
        } else {
            await api.sendMessage(message.threadID, `Usage: ${config.prefix}admin [add|remove|list] [userID]`);
        }
    }
};
