const ONE_HOUR = 1000 * 60 * 60;

const models = {
	BotExchangeRequest: (instance_id, session_id, input = "", context = {}) => {
		return {
			instance_id: instance_id,
			session_id: session_id,
			user_input: input,
			context: context
		}
	},
	BotExchangeResponse: (
		action = "",
		response = "",
		context = {},
		response_time = 1.0,
		confidence = 1.0,
		done = false,
		out_of_context = false) => {
		return {
			action: action,
			response: response,
			response_time: response_time,
			confidence: confidence,
			idontknow: confidence === 0,
			out_of_context: out_of_context,
			component_failed: confidence === 0 && done,
			component_done: done,
			updated_context: context,
		};
	},
	BotExchangeComplete: (action, response, context, response_time, confidence) =>
		models.BotExchangeResponse(
			action, response, context,
			response_time, confidence, true
		),
	BotExchangeFailure: (action, response, context, response_time) =>
		models.BotExchangeComplete(
			action, response, context,
			response_time, 0.0
		),
	BotCustomizeSessionRequest: (session_id, responses) => {
		return {
			session_id: session_id,
			responses: responses
		}
	},
	BotCustomizeSessionResponse: (session_id, success = true) => {
		return {
			session_id: session_id,
			success: success
		};
	},
	BotCustomiseInstanceRequest: (instance_id, responses) => {
		return {
			instance_id: instance_id,
			responses: responses
		}
	},
	BotCustomizeInstanceResponse: (instance_id, success = true) => {
		return {
			instance_id: instance_id,
			success: success
		};
	},
	BotBadRequestResponse: message => {
		return {
			response: "Request could not be interpreted.",
			component_failed: true,
			details: message
		};
	},
	BotNotFoundReply: bot_id => {
		return {
			response: `BOT "${bot_id}" DOES NOT EXIST ON THIS SERVER.`,
			component_failed: true,
		};
	},
	BotActionNotFoundError: action => {
		return {
			response: `Unhandled action "${action}".`,
			component_failed: true
		}
	},

	Session: (session_id = '', duration = ONE_HOUR, time = Date.now()) => {
		return {
			session_id: session_id,
			created: time,
			expires: time + duration,
			state: {
				action: "index",
			},
			responses: [],
			log: [] // Back and forth log
		}
	},

	Instance: (instance_id = 'default') => {
		return {
			instance_id: instance_id,
			responses: []
		}
	},

	Log: (message = '', context = {}, state = {}, from = 'user') => {
		return {
			message: message,
			context: context,
			state: state,
			from: from
		}
	},
	UserLog: (message, context, state) => {
		return models.Log(message, context, state);
	},
	BotLog: (message, context, state) => {
		return models.Log(message, context, state, 'bot');
	},
};

module.exports = models;
