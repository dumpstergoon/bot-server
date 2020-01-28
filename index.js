// @ts-nocheck

// I need to move the actual "app" assignment outside of here and into the server-script.
// This allows us to keep this as a fragment and easily embeddable into your own
// server application.
const ømq = require('zeromq');
const request = require("request");
const {
	store
} = require("./io");
const {
	parse,
	generate_uuid
} = require("./utils");
const models = require("./models");

const SKYCRATE_LTD = 'SkyCrate Ltd.';
const BEN = 'Bot Exchange Network (B.E.N)';
const REGISTRY = "./data/registry.json";
const INSTANCES = "./data/instances.json";

const registry = store(REGISTRY);
const instances = store(INSTANCES);

const construct_id = (bot_id, instance_id, delim = ':') =>
	bot_id + (instance_id ? delim + instance_id : '');

const extract_ids = (string, delim = ':') => {
	let pivot = string.lastIndexOf(delim);
	return pivot > 0 ? [
		string.substr(0, pivot),
		string.substr(pivot + 1)
	] : [string]
};

const send = (bot_id, message, callback) => {
	let bot = registry[bot_id];
	if (!bot)
		return callback(models.BotNotFoundReply(bot_id));
	
	let socket = new ømq.Request;
	socket.connect(bot.uri);
	
	socket.send(JSON.stringify(message)).then(() =>
		socket.receive().then(message =>
			callback(parse(message))));
};

const bot_fetch_logs = (bot_id, session_id, callback) =>
	send(bot_id, models.SessionLogsRequest(
		session_id
	), callback);

const bot_customize_instance = (bot_id, instance_id, responses, callback) =>
	send(bot_id, models.CustomiseInstanceRequest(
		instance_id,
		responses
	), callback);

const bot_customize_session = (bot_id, session_id, responses, callback) =>
	send(bot_id, models.CustomizeSessionRequest(
		session_id,
		responses
	), callback);

const bot_clear_session = (bot_id, session_id, callback) =>
	send(bot_id, models.ClearSessionRequest(session_id), callback);

const bot_exchange = (bot_id, instance_id, session_id, input, context = {}, callback) =>
	send(bot_id, models.ExchangeRequest(
		instance_id,
		session_id,
		input,
		context
	), callback);

module.exports = {
	init: (router, socket_router) => {
		router.all('*', (req, res, next) => {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Request-Headers",
				"GET, POST, OPTIONS, PATCH, PUT");
			res.header("Access-Control-Allow-Headers",
				"DNT,User-Agent,X-Requested-With,If-Modified-Since,\
				Cache-Control,Content-Type,Range");
			res.header("Access-Control-Expose-Headers",
				"Content-Length,Content-Range");
			next();
		});

		router.use((req, res, next) => {
			console.log('========================================');
			console.log('URL:', req.url);
			console.log('Method:', req.method);
			next();
		});

		router.route("/exchange")
			.get((req, res) =>
				res.render("bot-list", {
					title: `${SKYCRATE_LTD} | ${BEN}`,
					bots: Object.values(registry),
				}))
			.put((req, res, next, info = req.body) => {
				// TODO: forbid underscore characters in bot-id's
				registry[info.id] = info;
				console.log(`"${info.name}" Registered.`);
				res.sendStatus(200);
			})
			.patch((req, res, next, info = req.body) => {
				registry[info.id].update(info);
				console.log(`"${info.name}" Updated.`);
				res.sendStatus(200);
			});

		router.route("/exchange/:bot_id")
			.get((req, res, next, id = req.params.bot_id) => {
				let [
					bot_id,
					potential_id,
					instance_id = potential_id || 'default'
				] = extract_ids(id);

				let bot = registry[bot_id];

				res.render(bot ? "bot-details" : "bot-not-found", {
					title: `${SKYCRATE_LTD} | ${BEN} | ${bot_id}`,
					id: construct_id(bot_id, potential_id),
					instance_id: instance_id,
					bot: bot || {
						id: bot_id
					}
				});

			})
			.put((req, res, next, id = req.params.bot_id) => {
				let [
					bot_id,
					potential_id,
					instance_id = potential_id || generate_uuid()
				] = extract_ids(id);

				let real_id = instances[id];
				if (real_id) {
					bot_id = real_id;
					instance_id = id;
				}
				
				console.log('==============================');
				console.log(id);
				console.log(bot_id);
				console.log(instance_id);

				bot_customize_instance(
					bot_id,
					instance_id,
					req.body,
					msg => {
						res.json({
							id: `${bot_id}_${instance_id}`,
							details: msg || {}
						});
					}, error => {
						console.error(error);
						res.sendStatus(500);
					});
			});

		router.route("/exchange/:bot_id/:session_id")
			.get((req, res, next,
					id = req.params.bot_id,
					session_id = req.params.session_id) => {
				
				let [
					bot_id,
					potential_id,
					instance_id = potential_id || 'default'
				] = extract_ids(id);

				let bot = registry[bot_id];

				res.render(bot ? "bot-ui" : "bot-not-found", {
					title: `${SKYCRATE_LTD} | ${BEN} | ${bot_id} @ ${session_id}`,
					id: construct_id(bot_id, potential_id),
					bot: bot || {
						name: bot_id
					},
					instance_id: instance_id,
					session_id: session_id
				})
			})
			.post((req, res, next,
				id = req.params.bot_id,
				session_id = req.params.session_id,
				msg = req.body) => {
				
				let [
					bot_id,
					potential_id,
					instance_id = potential_id || 'default'
				] = extract_ids(id);

				// Right, so i need to test this endpoint..
				// it's causing my bot to crash.
				console.log('POST REQUEST');
				console.log(bot_id, instance_id, session_id);

				bot_exchange(
					bot_id,
					instance_id,
					session_id,
					msg.user_input,
					msg.context,
					msg => {
						res.json(msg);
					}, error => {
						console.error(error);
						res.sendStatus(500);
					});
			})
			.put((req, res, next,
				id = req.params.bot_id,
				session_id = req.params.session_id) => {
				
				let [bot_id] = extract_ids(id);

				bot_customize_session(
					bot_id,
					session_id,
					req.body,
					msg => {
						res.json(msg);
					}, error => {
						console.error(error);
						res.sendStatus(500);
					});
			})
			.delete((req, res, next,
				id = req.params.bot_id,
				session_id = req.params.session_id) => {
				bot_clear_session(extract_ids(id)[0], session_id, msg => res.json(msg));
			});
		
		router.ws("/exchange/:bot_id/:session_id",
			(ws, req, next,
				id = req.params.bot_id,
				session_id = req.params.session_id) => {
				
				let [
					bot_id,
					potential_id,
					instance_id = potential_id || 'default'
				] = extract_ids(id);

				ws.path = req.path;
				ws.on('message', msg => {
					msg = JSON.parse(msg);

					// All server clients....
					let clients = Array.from(socket_router.getWss().clients);

					// All clients at this endpoint...
					clients = clients.filter(sock =>
						sock.path === req.path);
					
					// All clients at this endpoint that DID NOT send the request...
					let others = clients.filter(sock => sock !== ws);
					
					// Tell the "others" what happened...
					others.forEach(client => {
						client.send(JSON.stringify(msg))
					});
					
					// Then we wanna talk with our bot...
					bot_exchange(
						bot_id,
						instance_id,
						session_id,
						msg.user_input,
						msg.context,
						msg => {
							// Send message back to ALL clients
							clients.forEach(client =>
								console.log("???", msg) ||
								client.send(JSON.stringify(msg)));
						}, error => {
							console.error(error);
						});
				});
			});
		
		router.route("/exchange/:bot_id/:session_id/log")
			.get((req, res, next,
					id = req.params.bot_id,
					session_id = req.params.session_id) => {
				
					let [bot_id] = extract_ids(id);
					
					console.log('>>', bot_id);

					bot_fetch_logs(bot_id,
						session_id, msg => res.json(msg));
				});

		router.route("/config/:bot_id")
				.get((req, res, next,
					id = req.params.bot_id) => {
					let bot = registry[id];
					res.json({
						blueprint_id: id,
						bot_name: bot.name,
						personality: "form-filling",
						action_config: bot.responses
					});
				})
				.post((req, res, next,
					id = req.params.bot_id,
					msg = req.body) => {
					instances[id] = {
						bot_id: msg.blueprint_id
					};
					request.put({
						url: `http://localhost:3000/exchange/${msg.blueprint_id}:${id}`,
						json: msg.action_config
					}, (e, r, b) => {
						if (e)
							return error ? error(err) : null;
						res.sendStatus(200);
					});
				})
		// This is for Facebook... possibly Whatsapp as well.
		// Time to get these pages sorted and tested so I can use components
		// on FB, whatsapp, embedded, etc....
		router.route("/webhook")
			// Validation:
			.get(() => {})
			// Message or Postback received:
			.post(() => {});
		
		return router;
	}
};
