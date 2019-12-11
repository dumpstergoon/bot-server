// @ts-nocheck
const render_response = (template, model) => {
	console.log('BOT REDNER RESPONSE', template, model);
	return template.replace(/\[[*]+\]/gi, match => model[match] || `<error: "${match}" not defined>`);
};

const { response } = require('../models');

module.exports = (
	responses,
	actions,
	_queue = [],
	_state = require("./state"),
	_timestamp = 0) => {
		const send = (next_action, msg, done = false) => {
			let state = _queue.shift()[2];
			state.action = next_action;

			io.send(response(_timestamp, msg, state.context, done ? 0 : 1));

			if (_queue.length)
				next();
		};

		const route = next_action => {
			console.log('BOT ROUTE =>', next_action);
			let args = _queue.shift();
			let state = args[2];

			args[1] = state.context || {};
			args[2].action = next_action;

			_queue.push(args);
			next();
		};

		const pass = (next_action, response) => {
			console.log('BOT PASS =>', next_action);

			let args = _queue.shift();
			let state = args[2];

			args[0] = response;
			args[1] = state.context || {};
			args[2].action = next_action;

			_queue.push(args);
			next();
		};
		
		const next = () => {
			console.log('BOT NEXT...');
			if (_queue.length === 0)
				return console.log('BOT WAITING...');
			
			_timestamp = Date.now();
			
			let [msg, context, state] = _queue[0];
			state.context = Object.assign(state.context || {}, context);
			
			console.log('BOT STEP -->', state.action.toUpperCase());
			console.log('BOT STEP RECEIVED <--', msg, state);

			actions[state.action](
				msg,
				state,
				Object.assign((responses[state.action] ||
					[`<error: no responses found for action "${state.action}"`])
					.map(action => Object.assign(action, {
						render(model) {
							console.log('BOT RESPONSE REDNER:', model);
							return render_response(this, model);
						}
					})), {
						random() {
							return this[Math.round(Math.random() * (this.length - 1))];
						}
					}),
				send,
				route,
				pass
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
