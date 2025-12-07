const path = require('path');
const fs = require('fs-extra');

module.exports = async function (api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, createOraDots) {
	const { log, getText } = global.utils;
	const { configCommands } = global.GoatBot;

	// Load commands from scripts/cmds
	const commandFiles = fs.readdirSync(path.join(__dirname, '../../scripts/cmds'))
		.filter(file => file.endsWith('.js') && !file.includes('.eg.'));

	for (const file of commandFiles) {
		try {
			const command = require(path.join(__dirname, '../../scripts/cmds', file));
			if (!command.config || !command.config.name) continue;

			const commandName = command.config.name;
			command.location = path.join(__dirname, '../../scripts/cmds', file);

			// Register command
			global.GoatBot.commands.set(commandName, command);

			// Register aliases
			if (command.config.aliases) {
				const aliasesList = Array.isArray(command.config.aliases)
					? command.config.aliases
					: [command.config.aliases];

				for (const alias of aliasesList) {
					global.GoatBot.aliases.set(alias, commandName);
				}
			}

			// Register event handlers
			if (command.onChat) global.GoatBot.onChat.push(commandName);
			if (command.onEvent) global.GoatBot.onEvent.push(commandName);
			if (command.onReply) global.GoatBot.onReply.set(commandName, command.onReply);
			if (command.onReaction) global.GoatBot.onReaction.set(commandName, command.onReaction);

			log.master("LOADED", `Command: ${commandName}`);
		} catch (err) {
			log.err("LOAD COMMAND", file, err);
		}
	}

	// Load event commands from scripts/events
	const eventFiles = fs.readdirSync(path.join(__dirname, '../../scripts/events'))
		.filter(file => file.endsWith('.js') && !file.includes('.eg.'));

	for (const file of eventFiles) {
		try {
			const event = require(path.join(__dirname, '../../scripts/events', file));
			if (!event.config || !event.config.name) continue;

			const eventName = event.config.name;
			event.location = path.join(__dirname, '../../scripts/events', file);

			global.GoatBot.eventCommands.set(eventName, event);

			if (event.onStart) global.GoatBot.onEvent.push(eventName);

			log.master("LOADED", `Event: ${eventName}`);
		} catch (err) {
			log.err("LOAD EVENT", file, err);
		}
	}
};