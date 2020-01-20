// @ts-nocheck

const ømq = require("zeromq");
const request = require("request");
const {
	parse,
	stringify
} = require("../utils");

const render_error = config => {
	return [
		`Could not register "${config.name}".`,
		`${config.id} => ${config.uri} @ ${config.host} failed.`
	];
};

const register = (info, success, error) => {
	request.put({
		url: `${info.host}/${info.id}`,
		json: info
	}, (err, res, body) => {
		if (err)
			return error ? error(err) : null;
		success(body);
	});
};

const listen = async channel => {
	let message = parse(await channel.receive());
	
	console.log(message);
	// return the message back to the client...
	await channel.send(stringify(message));

	// Repeat...
	listen(channel);
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
		listen(channel);
	}, err => {
		console.error(render_error(config).join('\n'));
	});
};

module.exports = {
	init: init
};
