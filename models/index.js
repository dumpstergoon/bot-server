module.exports = {
	BotExchangeRequest: (session_id, input = "", context = {}) => {
		return {
			session_id: session_id,
			user_input: input,
			context: context
		}
	},
	BotCustomizeRequest: (session_id, responses) => {
		return {
			session_id: session_id,
			responses: responses
		}
	},
	BotNotFoundReply: bot_id => {
		return {
			response: `BOT "${bot_id}" DOES NOT EXIST ON THIS SERVER.`,
			component_failed: true,
		};
	}
};
