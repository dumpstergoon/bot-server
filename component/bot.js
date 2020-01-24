// @ts-nocheck

const ømq = require("zeromq");
const request = require("request");
const models = require('../models');
const {
	directory
} = require('../io');
const {
	parse,
	stringify
} = require("../utils");

const sessions = directory('./data/sessions');
const instances = directory('./data/instances');

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

// Yeah... this could work...
const exchange = async (actions, msg, state, responses, output = []) => {
	let current_action = state.action;
	console.log('CURRENT ACTION:', current_action);

	let response = await actions[current_action](
		msg, state,
		models.Responses(responses[current_action] || [])
	);
	state.action = response.next_action;

	console.log('NEXT ACTION:', response.next_action);
	
	if (response.type === 'send')
		return Object.assign(response, {
			response: (output.length ? output.join(' ') + ' ' : '') + response.response
		});
	
	if (response.type === 'pass')
		output.push(response.response);
	
	return await exchange(
		actions,
		response.user_input,
		state,
		responses,
		[...output]);
};

const listen = async (channel, actions = {}, responses = {}, schema = {}) => {
	let message = parse(await channel.receive());
	let _timestamp = Date.now();

	instances[message.instance_id] = instances[message.instance_id] ||
		models.Instance(message.instance_id);
	
	let instance = instances[message.instance_id];
	
	if (message.session_id) {
		// TODO: Need a proper function for this...
		sessions[message.session_id] = sessions[message.session_id] ||
			models.Session(message.session_id, message.context);
		let session = sessions[message.session_id];

		console.log('=============================================');
		console.log(session);
		console.log('=============================================');

		if (message.user_input) {
			let action_name = session.state.action;

			if (!actions[action_name])
				await channel.send(stringify(models.ActionNotFoundError(action_name)));
			else {
				if (message.context)
					session.context = Object.assign(session.context, message.context);
				
				// Anything we get from the client, we add to our state's model...
				session.state.update_model(session.context);

				// clear context
				session.state.context = {};

				let action = await exchange(
					actions, message.user_input, session.state,
					session.responses || instance.responses ||
						responses || [`<${session.state.action}:NO_RESPONSES_FOUND>`]);
				
				let response = models.ExchangeResponse(
					action_name,
					action.response || '<NO_RESPONSE_PROVIDED>',
					session.state.context,
					(Date.now() - _timestamp) / 1000,
					action.confidence,
					action.done,
					false,
					action.failed
				);
				// Send back our ExchangeResponse...
				await channel.send(stringify(response));

				session.log = session.log.concat(
					models.UserMessageLog(message),
					models.BotMessageLog(response)
				);
				// Once our exchange flow has finished, save the session:
				session.save();
			}
		} else if (message.responses) {
			session.responses = message.responses;
			await channel.send(stringify(models.CustomizeSessionResponse(message.session_id)));
		} else if (message.clear) {
			delete sessions[message.session_id];
			await channel.send(stringify(models.ClearSessionResponse(session.session_id)));
		} else if (message.log) {
			await channel.send(stringify(models.SessionLogsResponse(session.session_id, session.log)));
		}
	} else if (message.responses && instance !== 'default') {
		instance.responses = message.responses;
		await channel.send(stringify(models.CustomizeInstanceResponse(message.instance)));
	} else
		await channel.send(stringify(models.BadClientRequest(message)));

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
		// Now that we're registered, time to start listening!
		listen(channel, actions, responses, schema);
	}, err => {
		console.error(render_error(config).join('\n'));
	});
};

module.exports = {
	init: init
};
