// @ts-nocheck
const express = require('express'),
		app = express(),
 		port = process.env.PORT || 3000;
const request = require("request");
const { execFile } = require("child_process");
const fs = require("fs");

const BOT_DIR = process.env.COMPONENTS || "./components";
const REMOTE_BOTS = require("./components.json");
const SESSION_ID = require("uuid/v1")();

app.listen(port);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(`serving on port ${port}`);

const remote_component = description => (req, res) => {
	console.log(`User input: "${req.body.user_input}"`);
	request({
		url: description.url + SESSION_ID,
		method: 'POST',
		headers: description.headers || {},
		body: JSON.stringify(req.body)
	}, (e, r, b) => {
		if (e)
			res.send(e);
		else
			console.log('Bot response:', JSON.parse(b)) || res.json(JSON.parse(b));
	})
};

const local_component = description => (req, res) => {
	console.log('Executing component:', description.path);
	console.log(`User input: "${req.body.user_input}"`);
	execFile(
		description.path,
		[SESSION_ID, JSON.stringify(req.body)],
		(error, stdout, stderr) => {
			if (error)
				res.send(stderr);
			else
				console.log('Bot response:',
					JSON.parse(stdout)) ||
				res.json(JSON.parse(stdout));
		}
	);
};



Object.entries(REMOTE_BOTS).forEach(([name, description]) => {
	console.log(`Routing "localhost:${port}/${name}" to ${description.url}`);
	app.route(`/${name}`).post(remote_component(description));
});

fs.readdirSync(BOT_DIR).forEach(name => {
	console.log(`Routing "localhost:${port}/${name}" to ${BOT_DIR}/${name}/`);
	app.route(`/${name}`).post(local_component({
		path: `${BOT_DIR}/${name}/index`
	}));
});
