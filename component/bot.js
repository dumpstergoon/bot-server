// @ts-nocheck
const name_trim = match =>
	match.substr(1, match.length - 2);

const transform_model = (model = {}) => {
	let time = new Date().getHours();
	return Object.assign({
		name: model.user ? model.user.fristName : '<no_name_found>',
		fullname: model.user ? `${model.user.title} ${model.user.firstName} ${model.user.lastName}` : '<no_name_found>',
		email: model.userInfo ? model.userInfo.email : '<no_email_found>',
		time_of_day: time >= 17 ? 'evening' :
			(time >= 12 ? 'afternoon' :
				(time >= 5 ? 'morning' : 'evening')),
	}, model);
};

const render_response = (template, model, _model = transform_model(model)) =>
	template.replace(/\[[\w]+\]/gi, match => _model[name_trim(match)] || '[]');

const { response } = require('../models');

module.exports = (
	responses,
	actions,
	_queue = [],
	_state = require("./state"),
	_timestamp = 0,
	_prefix = '') => {
		const send = (next_action, msg, done = false) => {
			let state = _queue.shift()[2];
			state.action = next_action;

			io.send(response(_timestamp, _prefix + msg, state.context, done ? 10 : 1));
			_prefix = '';

			if (_queue.length)
				next();
		};

		const route = next_action => {
			console.log(`----------------------------------------`);
			console.log(`BOT ROUTE TO STEP => "${next_action}"`);
			console.log(`----------------------------------------`);

			let args = _queue.shift();
			let state = args[2];

			args[1] = state.context || {};
			args[2].action = next_action;

			_queue.push(args);
			next();
		};

		const pass = (next_action, response) => {
			console.log(`----------------------------------------`);
			console.log(`BOT PASS TO STEP => "${next_action}"`);
			console.log(`----------------------------------------`);

			let args = _queue.shift();
			let state = args[2];

			args[0] = "";
			args[1] = state.context || {};
			args[2].action = next_action;

			_queue.push(args);
			_prefix += response + ' ';
			next();
		};
		
		const next = () => {
			if (_queue.length === 0)
				return;
			
			_timestamp = Date.now();
			
			let [msg, context, state] = _queue[0];
			state.context = Object.assign(state.context || {}, context);
			
			console.log(`----------------------------------------`);
			console.log(`BOT STEP: "${state.action.toUpperCase()}"`);
			console.log(`BOT STEP: "${msg}"`, state);
			console.log(`----------------------------------------`);

			actions[state.action](
				msg,
				state,
				Object.assign((responses[state.action] ||
					['']) // TODO: Work on rendering a bit more...
					.map(action => Object.assign(action, {
						render(model) {
							// console.log('BOT RENDER:', this, model);
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
