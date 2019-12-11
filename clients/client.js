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
			console.log('CLIENT SEND =>', message, context);
			request({
				url: endpoint,
				method: 'POST',
				json: {
					user_input: message,
					content: context
				},
			}, (e, r, b) => {
				console.log('CLIENT RECEIVE <=');
				if (e || b.component_failed) {
					console.log('CLIENT FAILED!', e ? 'NETWORK ERROR' : 'COMPONENT ERROR', e || b);
					on_failed(endpoint, message, context, b);
				} else if (b.out_of_context || b.idontknow) {
					console.log('CLIENT OUT OF CONTEXT OR CONFUSED', b);
					on_stumped(b);
				} else {
					console.log('CLIENT COMPONENT RESPONSE', b);
					on_response(b);
					if (b.component_done) {
						console.log('CLIENT COMPONENT COMPLETE', b);
						on_done(b);
					}
				}
			});
			return this;
		}
	}
};

module.exports = Client;
