// @ts-nocheck
const request = require("request");

const pipe = (list = []) =>
	Object.assign(
		input =>
			list.reduce((input, func) => func(input), input),
		{
			add(func) {
				list.push(func);
			}
		});

const Client = endpoint => {
	let on_response = pipe();
	let on_done = pipe();
	let on_failed = pipe();

	return {
		response(callback) {
			on_response.add(callback);
			return this;
		},
		done(callback) {
			on_done.add(callback);
			return this;
		},
		failed(callback) {
			on_failed.add(callback);
			return this;
		},
		send(message, context = {}) {
			request({
				url: endpoint,
				method: 'POST',
				json: {
					user_input: message,
					content: context
				},
			}, (e, r, b) => {
				if (e || b.component_failed)
					on_failed(endpoint, message, context, b);
				else {
					on_response(b);
					if (b.component_done)
						on_done(b);
				}
			});
			return this;
		}
	}
};

module.exports = Client;
