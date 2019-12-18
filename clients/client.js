// @ts-nocheck
const request = require("request");

const pipe = (list = []) =>
	Object.assign(
		input =>
			list.reduce((input, func) => func(input), input),
		{
			add(func) {
				list.push(func);
				return this;
			}
		});

const Client = endpoint => {
	let on_response = pipe();
	let on_done = pipe();
	let on_stumped = pipe();
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
		stumped(callback) {
			on_stumped.add(callback);
			return this;
		},
		send(message, context = {}) {
			request({
				url: endpoint,
				method: 'POST',
				json: {
					user_input: message,
					context: context
				},
			}, (e, r, b) => {
				if (e || b.component_failed) {
					console.error('CLIENT FAILED!', e ? 'NETWORK ERROR' : 'COMPONENT ERROR', e || b);
					on_failed(endpoint, message, context, b);
				} else if (b.out_of_context || b.idontknow) {
					console.debug('CLIENT OUT OF CONTEXT OR CONFUSED', b);
					on_stumped(b);
				} else {
					console.debug('CLIENT COMPONENT RESPONSE', b);
					on_response(b);
					if (b.component_done) {
						console.debug('CLIENT COMPONENT COMPLETE', b);
						on_done(b);
					}
				}
			});
			return this;
		}
	}
};

module.exports = Client;
