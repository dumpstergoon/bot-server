const {
	create,
	constructor
} = require("../utils");
const ONE_HOUR = 1000 * 60 * 60;

const models = {
	ExchangeRequest: (instance_id, session_id, input = "", context = {}) => {
		return {
			instance_id: instance_id,
			session_id: session_id,
			user_input: input,
			context: context
		}
	},
	ExchangeResponse: (
		action = "",
		response = "",
		context = {},
		response_time = 1.0,
		confidence = 1.0,
		done = false,
		out_of_context = false,
		failed = false) => {
		return {
			action: action,
			response: response,
			response_time: response_time,
			confidence: confidence,
			idontknow: confidence === 0,
			out_of_context: out_of_context,
			component_failed: failed,
			component_done: done,
			updated_context: context,
		};
	},

	ExchangeComplete: (action, response, context, response_time, confidence) =>
		models.ExchangeResponse(
			action, response, context,
			response_time, confidence, true
		),
	ExchangeFailure: (action, response, context, response_time, reason) =>
		Object.assign(models.ExchangeComplete(
			action, response, context,
			response_time, 0.0
		), {
			reason: reason || 'UNKNOWN'
		}),
	
	SessionLogsRequest: session_id => {
		return {
			session_id: session_id,
			log: true
		}
	},
	SessionLogsResponse: (session_id, log = []) => {
		return {
			session_id: session_id,
			log: log
		}
	},
	ClearSessionRequest: session_id => {
		return {
			session_id: session_id,
			clear: true
		}
	},
	ClearSessionResponse: (session_id, success = true) => {
		return {
			session_id: session_id,
			success: success
		}
	},
	CustomizeSessionRequest: (session_id, responses) => {
		return {
			session_id: session_id,
			responses: responses
		}
	},
	CustomizeSessionResponse: (session_id, success = true) => {
		return {
			session_id: session_id,
			success: success
		}
	},
	
	CustomiseInstanceRequest: (instance_id, responses) => {
		return {
			instance_id: instance_id,
			responses: responses
		}
	},
	CustomizeInstanceResponse: (instance_id, success = true) => {
		return {
			instance_id: instance_id,
			response: `Bot instance "${instance_id} successfully modified."`,
			success: success
		}
	},


	BadClientRequest: message => {
		return {
			response: "Request could not be interpreted.",
			component_failed: true,
			details: message
		};
	},
	BotNotFoundReply: bot_id => {
		return {
			response: `<BOT_"${bot_id}"_NOT_FOUND>`,
			component_failed: true,
		};
	},
	ActionNotFoundError: action => {
		return {
			response: `<ACTION_"${action}"_NOT_FOUND>`,
			component_failed: true
		}
	},

	State: constructor(options => {
		return Object.assign({
			action: "index",
			context: {},
			model: {},
		}, options);
	}, {
		update_context(context) {
			return this.context =
				Object.assign(this.context, context);
		},
		update_model(model) {
			return this.model =
				Object.assign(this.model, model);
		}
	}),

	Session: (session_id = '', context, duration, time) => {
		time = time || Date.now();
		let o =  create({
			session_id: session_id,
			created: time,
			expires: time + (duration || ONE_HOUR),
			state: models.State(),
			responses: null,
			context: context || {},
			log: [] // Back and forth log
		}, {
			log_message() {
				// TODO: add ability to save logs...
				// this is good for refreshing sessions in say, a browser,
				// and having all the messages come down the pipe.
				// TODO: create end-point for logs.
			}
		});
		console.log('CREATING SESSION OBJECT', o);
		return o;
	},

	Instance: (instance_id = 'default') => {
		return {
			instance_id: instance_id,
			responses: null
		}
	},

	Response: template_string => {
		return Object.assign(template_string, {
			name_trim(match) {
				return match.substr(1, match.length - 2);
			},
			render(model) {
				return template_string.replace(/\[[\w]+\]/gi,
					match => model[this.name_trim(match)] || `<${ match }_NOT_FOUND>`);
			}
		});
	},

	Responses: list => {
		return Object.assign(list, {
			random() {
				return models.Response(
					list[Math.round(Math.random() * (list.length - 1))]);
			}
		});
	},

	ResponseModel: model => {
		let datetime = new Date(model.timestamp || Date.now()).getHours();
		return Object.assign(model, {
			name: model.user ? model.user.fristName : '<NAME_NOT_FOUND>',
			fullname: model.user ? `${model.user.title} ${model.user.firstName} ${model.user.lastName}` : '<FULLNAME_NOT_FOUND>',
			email: model.userInfo ? model.userInfo.email : '<EMAIL_NOT_FOUND>',
			time_of_day: datetime >= 17 ? 'evening' :
				(datetime >= 12 ? 'afternoon' :
					(datetime >= 5 ? 'morning' : 'evening')),
		});
	},

	Message: (next_action, type, done = false, failed = false) => {
		return {
			next_action: next_action || 'index',
			type: type || 'send',
			done: done,
			confidence: 1.0,
			failed: failed
		}
	},

	ResponseMessage: (next_action, response, type, done = false, failed = false) => Object.assign(
		models.Message(next_action, type, done, failed),
		{
			response: response
		}
	),

	SendMessage: (next_action, response, done = false, failed = false) =>
		models.ResponseMessage(next_action, response, 'send', done, failed),

	PassMessage: (next_action, msg, response) => Object.assign(
		models.ResponseMessage(next_action, response, 'pass'),
		{
			user_input: msg
		}
	),

	RouteMessage: (next_action, msg) => Object.assign(
		models.Message(next_action, 'route'),
		{
			user_input: msg
		}
	),

	ExitMessage: response =>
		models.SendMessage("exit", response, true),
	
	FailedMessage: response =>
		models.SendMessage("failed", response, true, true),
	
	MessageLog: (type, exchange) => {
		return {
			type: type,
			msg: type === 'user' ? exchange.user_input : exchange.response,
			exchange: exchange
		};
	},

	UserMessageLog: exchange => {
		return models.MessageLog('user', exchange)
	},
	BotMessageLog: exchange => {
		return models.MessageLog('bot', exchange)
	}
};

module.exports = models;
