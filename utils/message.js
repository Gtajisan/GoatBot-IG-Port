
module.exports = function (api, event) {
	const message = {
		threadID: event.threadID || event.sender?.id,
		senderID: event.senderID || event.sender?.id,
		messageID: event.messageID || event.message?.mid,
		body: event.body || event.message?.text || '',
		
		reply: async function (content, callback) {
			const msg = typeof content === 'string' ? { body: content } : content;
			return api.sendMessage(msg, this.threadID, callback);
		},
		
		send: async function (content, threadID, callback) {
			const msg = typeof content === 'string' ? { body: content } : content;
			const tid = threadID || this.threadID;
			return api.sendMessage(msg, tid, callback);
		},
		
		unsend: async function (messageID) {
			return api.unsendMessage(messageID || this.messageID);
		},
		
		react: async function (emoji, messageID) {
			return api.setMessageReaction(emoji, messageID || this.messageID, this.threadID);
		},
		
		err: function (error) {
			console.error('Message Error:', error);
			return this.reply(`❌ An error occurred: ${error.message || error}`);
		},
		
		SyntaxError: function () {
			return this.reply('⚠️ Invalid syntax. Use help <command> to see usage.');
		}
	};
	
	return message;
};
