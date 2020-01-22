// @ts-nocheck

const ømq = require("zeromq");
const request = require("request");
const models = require('../models');
const {
	directory
} = require('../io');
const {
	parse,
	stringify,
	generate_uuid
} = require("../utils");

const sessions = directory('./data/sessions', session_id =>
	models.Session(session_id));
const instances = directory('./data/instances', instance_id =>
	models.Instance(instance_id));

const render_error = config => {
	return [
		`Could not register "${config.name}".`,
		`${config.id} => ${config.uri} @ ${config.host} failed.`
	];
};

const register = (info, success, error) => {
	request.put({
		url: info.host,
		json: info
	}, (err, res, body) => {
		if (err)
			return error ? error(err) : null;
		success(body);
	});
};

const update = (info, success, error) => {
	request.patch({
		url: info.host,
		json: info
	}, (err, res, body) => {
		if (err)
			return error ? error(err) : null;
		success(body);
	})
};

const listen = async (channel, actions = {}, responses = {}, schema = {}) => {
	let message = parse(await channel.receive());
	let _timestamp = Date.now();
	let instance = instances[message.instance_id || 'default'];
	
	if (message.session_id) {
		let session = sessions[message.session_id];
		console.log('===============');
		console.log(session);
		console.log('===============');

		if (message.user_input) {
			let next_action = session.state.action;

			if (!actions[next_action])
				await channel.send(stringify(models.BotActionNotFoundError(next_action)));
			else {
				//actions[next_action]();

				await channel.send(stringify(models.BotExchangeResponse(
					next_action,
					`THIS IS A GENERIC MESSAGE. You wrote "${message.user_input}".`,
					{
						test: "Hello, World."
					},
					(Date.now() - _timestamp) / 1000
				)));
			}
		} else if (message.responses) {
			session.responses = message.responses;
			await channel.send(stringify(models.BotCustomizeSessionResponse(message.session_id)));
		}
		
	} else if (message.responses && instance !== 'default') {
		instance.responses = message.responses;
		await channel.send(stringify(models.BotCustomizeInstanceResponse(message.instance)));
	} else
		await channel.send(stringify(models.BotBadRequestResponse(message)));

	// Repeat...
	listen(channel, actions, responses, schema);
};

const init = async (config, responses, schema, actions) => {
	const channel = new ømq.Reply;
	await channel.bind(config.uri);
	console.log("Bot component Ready. Sending request to register.");

	register(Object.assign(
		config,
		{
			responses: responses,
			schema: schema
		}
	), () => {
		console.log(`"${config.name}" has been registered at ${config.host}/${config.id}`);

		// TODO: Now we gotta do shit with these actions. Save some state, yada yada yada. Get'er done.

		listen(channel, actions, responses, schema);
	}, err => {
		console.error(render_error(config).join('\n'));
	});
};

module.exports = {
	init: init
};
