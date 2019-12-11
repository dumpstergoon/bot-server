// @ts-nocheck
const DO_NOTHING = (x => x);

const clients = require("../clients");
const nlp = require("../nlp");

module.exports = {
	default: (next_action, context = {}) => {
		return (msg, state, responses, send) => {
			let user = state.context.user;
			let info = state.context.userInfo;
			send(next_action, responses.random().render(
				Object.assign(context, {
					name: user ? user.firstName : "boss",
					email: info ? info.email : "<NO EMAIL SPECIFIED>"
				}))
			);
		};
	},
	bot: (bot_name, on_done = DO_NOTHING, on_stumped = DO_NOTHING, on_failed = DO_NOTHING) => {
		return (msg, state, responses, send, route, pass) => {
			clients.bot(bot_name, state.session_id)
				.response(data => {
					Object.assign(state.context, data.updated_context);
					if (data.component_done)
						on_done(data.response, state, send, route, pass)
					else
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
	// Passes shit to another component
	pass: (next_action, context) => {
		return (msg, state, responses, send, route, pass) => {
			let user = state.context.user;
			let info = state.context.userInfo;
			pass(next_action, msg + " " + responses.random().render(
				// TODO: create a render object that pulls from the
				// state to build cool shit.
				Object.assign(context, {
					// TODO: rrrrreally move this elsewhere...
					name: user ? user.firstName : "boss",
					email: info ? info.email : "<NO EMAIL SPECIFIED>"
				}))
			);
		};
	},
	exit: () => {
		return (msg, state, responses, send) => {
			send("", responses.random().toString(), true);
			if (!process.send)
				process.exit(0);
		};
	},
};
