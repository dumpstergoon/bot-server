// @ts-nocheck
const clients = require("../clients");

module.exports = {
	default: next_action => {
		return (msg, context, state, responses, send) => {
			send(
				// Next action:
				next_action,
				// Response text:
				responses.random().render({
					// TODO: do something with the context...
				}),
				// Updated context:
				context
			);
		};
	},
	bot: (bot_name, router) => {
		return (msg, context, state, responses, send) => {
			clients.bot(bot_name, state.session_id)
				.response(data => {
					send(
						// Next action:
						data.component_done ? router(data) : state.action,
						// Response text:
						data.response,
						// Updated context:
						context
					);
				})
				.send(msg, context);
		};
	},
};
