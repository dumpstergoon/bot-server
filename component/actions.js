// @ts-nocheck
const DO_NOTHING = (x => x);

const clients = require("../clients");
const nlp = require("../nlp");

module.exports = {
	default: (next_action, context = {}) => {
		return (msg, state, responses, send) => {
			send(next_action, responses.random().render(
				Object.assign(state.context, context)
			));
		};
	},
	bot: (bot_name, on_done = DO_NOTHING, on_stumped = DO_NOTHING, on_failed = DO_NOTHING) => {
		return (msg, state, responses, send, route, pass) => {
			clients.bot(bot_name, state.session_id)
				.response(data => {
					Object.assign(state.context, data.updated_context);
					if (data.component_done) {
						console.log('>>>>', bot_name, 'DONE.', data.response, state);
						on_done(data.response, state, send, route, pass)
					} else
						send(state.action, data.response)
				})
				.stumped(data => {
					// HANDLE STUMPED COMPONENT
					on_stumped(data);
				})
				.failed(data => {
					// HANDLE FAILED COMPONENT
					on_failed(data);
				})
				.send(msg, state.context);
		};
	},
	confirm: (yes_action, no_action, other_action) => {
		return (msg, state, responses, send, route, pass) => {
			if (nlp.yes.test(msg))
				route(yes_action);
			else if (nlp.no.test(msg))
				route(no_action);
			else
				route(other_action);
		};
	},
	pass: next_action => {
		return (msg, state, responses, send, route, pass) => {
			pass(next_action, responses.random().render(state.context))
		}
	},
	exit: (response = "") => {
		return (msg, state, responses, send) => {
			send("exit", response + ' ' + responses.random().render(state.context), true);
			if (!process.send)
				process.exit(0);
		};
	},
};
