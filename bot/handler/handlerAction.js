const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
	const handlerEvents = require("./handlerEvents.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

	return async function (event) {
		// Normalize Instagram event structure
		if (!event.threadID && event.sender?.id) {
			event.threadID = event.sender.id;
		}
		if (!event.senderID && event.sender?.id) {
			event.senderID = event.sender.id;
		}
		if (!event.body && event.message?.text) {
			event.body = event.message.text;
		}
		if (!event.messageID && event.message?.mid) {
			event.messageID = event.message.mid;
		}

		// Check if the bot is in the inbox and anti inbox is enabled
		if (
			global.GoatBot.config.antiInbox == true &&
			(event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
			(event.senderID || event.userID || event.isGroup == false)
		)
			return;

		const message = createFuncMessage(api, event);

		await handlerCheckDB(usersData, threadsData, event);
		const handlerChat = await handlerEvents(event, message);
		if (!handlerChat)
			return;

		const {
			onAnyEvent, onFirstChat, onStart, onChat,
			onReply, onEvent, handlerEvent, onReaction,
			typ, presence, read_receipt
		} = handlerChat;

		onAnyEvent();
		switch (event.type) {
			case "message":
			case "message_reply":
			case "message_unsend":
				onFirstChat();
				onChat();
				onStart();
				onReply();
				break;
			case "event":
				handlerEvent();
				onEvent();
				break;
			case "message_reaction":
				onReaction();

				const isAdmin = global.GoatBot.config.adminBot.includes(event.userID);

				if (event.reaction == "👎") {
					if (isAdmin) {
						api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
							if (err) return console.log(err);
						});
					} 
				}

				if (event.reaction == "😠") {
					if (isAdmin) {
						message.unsend(event.messageID);
					} 
				}
				break;
			case "typ":
				typ();
				break;
			case "presence":
				presence();
				break;
			case "read_receipt":
				read_receipt();
				break;
			default:
				break;
		}
	};
};