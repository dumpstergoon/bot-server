// @ts-nocheck
const express = require('express'),
		app = express(),
 		port = process.env.PORT || 3000;
const request = require("request");
const { readdirSync } = require("fs");
const { fork } = require("child_process");

const BOT_DIR = "./bots";
const REMOTE_BOTS = require("./bots.json");

app.listen(port);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(`serving on port ${port}`);

app.all('*', (req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Request-Headers", "GET, POST, OPTIONS");
	res.header("Access-Control-Allow-Headers", "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range");
	res.header("Access-Control-Expose-Headers", "Content-Length,Content-Range");
	next();
});

const remote_component = description => (req, res) => {
	console.log('\n\n========================================\n');
	console.log('----------------------------------------');
	console.log(`User Input: "${req.body.user_input}"`);
	console.log('----------------------------------------');

	request({
		url: description.url + req.params.session_id,
		method: 'POST',
		headers: description.headers || {},
		body: JSON.stringify(req.body)
	}, (e, r, b) => {
		if (e)
			res.send(e);
		else
			console.log('Bot response:', JSON.parse(b)) || res.json(JSON.parse(b));
		console.log('========================================\n\n');
	})
};

const local_component = bot => (req, res) => {
	console.log('\n\n========================================');
	console.log(`User Input: "${req.body.user_input}"`);
	console.log('----------------------------------------');

	bot.on('message', function listener(message, _msg = JSON.parse(message)) {
		console.log('Bot response:', _msg);
		res.json(_msg);
		bot.removeListener('message', listener);
		console.log('========================================\n\n');
	});

	bot.send(JSON.stringify(Object.assign({}, req.body, {
		session_id: req.params.session_id
	})));
};



console.log('\n========================================');
Object.entries(REMOTE_BOTS).forEach(([name, description]) => {
	console.log(`Routing "localhost:${port}/${name}" to uri ${description.url}`);
	app.route(`/${name}/:session_id`).post(remote_component(description));
});
console.log('>>');
readdirSync(BOT_DIR).forEach(name => {
	console.log(`Routing "localhost:${port}/${name}" to sub-process ${BOT_DIR}/${name}/`);

	let bot = fork(
		`${BOT_DIR}/${name}/index`, // path
		[],
		{
			stdio: ['pipe', 'pipe', 'pipe', 'ipc']
		});

	// Get'er piped, bro
	bot.stdout.pipe(process.stdout);

	app.route(`/${name}/:session_id`).post(local_component(bot));
});
console.log('========================================\n');
