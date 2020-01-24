// @ts-nocheck
const nlp = require("../nlp");
const {
	SendMessage,
	PassMessage,
	RouteMessage,
	ExitMessage,
	ResponseModel,
	FailedMessage
} = require("../models");

const render = (responses, state) =>
	console.log("<<<", state) ||
	responses.random().render(ResponseModel(state.model));

module.exports = {
	default: next_action =>
		async (msg, state, responses) =>
			SendMessage(next_action, render(responses, state)),
	router: route =>
		async (msg, state, responses) =>
			RouteMessage(route(msg, state, responses), msg),
	confirm: (yes_action, no_action, other_action) => {
		return async msg => {
			if (nlp.yes.test(msg))
				return RouteMessage(yes_action, msg);
			
			if (nlp.no.test(msg))
				return RouteMessage(no_action, msg);
			
			return RouteMessage(other_action, msg);
		};
	},
	pass: next_action =>
		async (msg, state, responses) =>
			PassMessage(next_action, msg, render(responses, state)),
	fail: (response = "") =>
		async (msg, state, responses) =>
			FailedMessage(response + ' ' + render(responses, state)),

	exit: (response = "") =>
		async (msg, state, responses) =>
			ExitMessage(response + ' ' + render(responses, state)),
};
