// @ts-nocheck
const clients = require("../clients");
const nlp = require("../nlp");

module.exports = {
	default: next_action => {
		return (msg, state, responses, send, route) => {
			let user = state.context.user;
			send(next_action, responses.random().render({
				// TODO: defaults somewhere else....
				name: user ? user.firstName : "boss",
			}));
		};
	},
	bot: (bot_name, router, out_of_context, failed) => {
		return (msg, state, responses, send, route) => {
			clients.bot(bot_name, state.session_id)
				.response(data => {
					let context = Object.assign(state.context, data.updated_context);
					if (data.out_of_context || data.idontknow)
						route(out_of_context(context));
					else if (data.component_failed)
						route(failed(context));
					else
						send(data.component_done ?
							router(context) :
								state.action, data.response);
				})
				.send(msg, state.context);
		};
	},
	confirm: (yes_action, no_action, other_action) => {
		return (msg, state, responses, send, route) => {
			if (nlp.yes.test(msg))
				route(yes_action);
			else if (nlp.no.test(msg))
				route(no_action);
			else
				route(other_action);
		};
	},
	exit: () => {
		return (msg, state, responses, send, route) => {
			send("", responses.random(), true);
			if (!process.send)
				process.exit(0);
		};
	},
};
