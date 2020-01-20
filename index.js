// @ts-nocheck

// I need to move the actual "app" assignment outside of here and into the server-script.
// This allows us to keep this as a fragment and easily embeddable into your own
// server application.
const ømq = require('zeromq');
const {
	store
} = require("./io");
const {
	parse,
	stringify
} = require("./utils");
const models = require("./models");

const SKYCRATE_LTD = 'SkyCrate Ltd.';
const BEN = 'Bot Exchange Network (B.E.N)';
const REGISTRY = "./data/registry.json";

const registry = store(REGISTRY);

const send = async (bot_id, message) => {
	let bot = registry[bot_id];
	if (!bot)
		return models.BotNotFoundReply(bot_id);
	
	let socket = new ømq.Request;
	socket.connect(bot.config.uri);
	await socket.send(stringify(message));
	return parse(await socket.receive());
};

const bot_customize = async (bot_id, session_id, responses) =>
	await send(bot_id, models.BotCustomizeRequest(
		session_id,
		responses
	));

const bot_exchange = async (bot_id, session_id, input, context = {}) =>
	await send(bot_id, models.BotExchangeRequest(
		session_id,
		input,
		context
	));

module.exports = {
	init: app => {
		app.all('/exchange/*', (req, res, next) => {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Request-Headers",
				"GET, POST, OPTIONS");
			res.header("Access-Control-Allow-Headers",
				"DNT,User-Agent,X-Requested-With,If-Modified-Since,\
				Cache-Control,Content-Type,Range");
			res.header("Access-Control-Expose-Headers",
				"Content-Length,Content-Range");
			next();
		});

		app.route("/exchange")
			.get((req, res) =>
				res.render("bot-list", {
					title: `${SKYCRATE_LTD} | ${BEN}`,
					bots: Object.values(registry),
				}))

		app.route("/exchange/:bot_id")
			.get((req, res, next, bot_id = req.params.bot_id) => {
				let bot = registry[bot_id];
				res.render(bot ? "bot-details" : "bot-not-found", {
					title: `${SKYCRATE_LTD} | ${BEN} | ${bot_id}`,
					bot: bot || {
						id: bot_id
					}
				})
			})
			.put((req, res) => {
				registry[req.params.bot_id] = req.body;
				console.log(`"${req.params.bot_id}" Registered.`);
				res.sendStatus(200);
			});

		app.route("/exchange/:bot_id/:session_id")
			.get((req, res, next,
					bot_id = req.params.bot_id,
					session_id = req.params.session_id) => {

				let bot = registry[bot_id];

				res.render(bot ? "bot-ui" : "bot-not-found", {
					title: `${SKYCRATE_LTD} | ${BEN} | ${bot_id} @ ${session_id}`,
					bot: bot || {
						name: bot_id
					},
					session_id: session_id
				})
			})
			// Our three (3) asynchronous routes....
			.post(async (req, res, next,
				bot_id = req.params.bot_id,
				session_id = req.params.session_id,
				msg = req.body) => {
				
				res.json(await bot_exchange(bot_id, session_id, msg.user_input = "", msg.context || {}));
			})
			.put(async (req, res, next,
				bot_id = req.params.bot_id,
				session_id = req.params.session_id) => {
				res.json(await bot_customize(bot_id, session_id, req.body));
			});
		
		// TODO: move these routes to router such that app is not being passed around.
		app.ws("/exchange/:bot_id/:session_id",
			async (ws, req, next,
				bot_id = req.params.bot_id,
				session_id = req.params.session_id) => {
				
				ws.on('message', async msg => {
					ws.send(await bot_exchange(bot_id, session_id, msg.user_input || "", msg.context || {}));
				});
			});

		// This is for Facebook... possibly Whatsapp as well.
		// Time to get these pages sorted and tested so I can use components
		// on FB, whatsapp, embedded, etc....
		app.route("/webhook")
			// Validation:
			.get(() => {})
			// Message or Postback received:
			.post(() => {});
	}
};
