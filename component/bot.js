// @ts-nocheck
const render_response = (template, model) => {
	return template.replace(/\[[*]+\]/gi, match => model[match] || `<error: "${match}" not defined>`);
};

module.exports = (
	responses,
	actions,
	_queue = [],
	_state = require("./state"),
	_timestamp = 0) => {
		const create_response = (
			message = "",
			state = {},
			confidence = 1,
			idontknow = confidence < 0.5,
			component_done = confidence === 0,
			component_failed = confidence === -1) => {
			return {
				response: message,
				response_time: (Date.now() - _timestamp) / 1000,
				confidence: confidence,
				idontknow: idontknow,
				component_done: component_done,
				component_failed: component_failed,
				updated_context: state,
			};
		};

		const send = (next_action, msg, context) => {
			io.send(create_response(msg, context));
			// This is hacky.. we should do better...
			_queue.shift()[2].action = next_action;
			if (_queue.length)
				next();
		};
		
		const next = () => {
			if (_queue.length === 0)
				return;
			
			let [msg, context, state] = _queue[0];
			
			_timestamp = Date.now();
			
			actions[state.action](
				msg,
				context,
				state,
				Object.assign((responses[state.action] ||
					[`<error: no responses found for action "${state.action}"`])
					.map(action => Object.assign(action, {
						render(model) {
							return render_response(this, model);
						}
					})), {
						random() {
							return this[Math.round(Math.random() * (this.length - 1))];
						}
					}),
				send
			);
		};

		let io = {
			send: data => console.log(data),
			receive: (session_id, msg, context = {}, state = _state[session_id]) => {
				if (_queue.push([msg, context, state]) > 1)
					return;
				next();
			}
		};
		return io;
	};
