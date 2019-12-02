const express = require('express'),
		app = express(),
 		port = process.env.PORT || 3000;
const request = require("request");
const { execFile } = require("child_process");

const components = require("./components.json");
const session_id = require("uuid/v1")();

app.listen(port);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(`Server running on port ${port} with session "${session_id}"`);

const remote_component = description => (req, res) => {
	request({
		url: description.url + session_id,
		method: 'POST',
		headers: description.headers || {},
		body: JSON.stringify(req.body)
	}, (e, r, b) => {
		if (e)
			res.send(e);
		else
			res.json(JSON.parse(b))
	})
};

const local_component = description => (req, res) => {
	console.log(req.body);
	child = execFile(
		description.path,
		[JSON.stringify(req.body)],
		(error, stdout, stderr) => {
			if (error)
				console.error('Error executing', description.path, error);
			else
				res.json(JSON.parse(stdout));
		}
	);
};

// go through the components and make a route for each one!
Object.entries(components).forEach(([name, description]) => {
	console.log(`ADDING COMPONENT ${name}`)
	app.route(`/${name}`).post(
		description.url ?
			remote_component(description) : local_component(description)
	);
});