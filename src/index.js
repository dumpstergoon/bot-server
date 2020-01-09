// @ts-nocheck

// I need to move the actual "app" assignment outside of here and into the server-script.
// This allows us to keep this as a fragment and easily embeddable into your own
// server application.
const express = require('express'),
		app = express(),
		port = process.env.PORT || 8080;

const registry = {};

app.listen(port);
app.use(express.json());
app.use(express.urlencoded({
	extended: true
}));

console.log(`Bot server hosting on port ${port}.`);

// Need to break these down in
app.all('*', (req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Request-Headers", "GET, POST, OPTIONS");
	res.header("Access-Control-Allow-Headers", "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range");
	res.header("Access-Control-Expose-Headers", "Content-Length,Content-Range");
	next();
});

// TODO: Need to Django this stuff together....
// like have something that BUILDS this server from
// a collection of route configurations and their functions.
// That way I can string different server "fragments"
// together...
// That means we need a server assembly project... and that this project
// will implement a fragment for the server assembly to consume.
// This works for our z-ui project too... creating a server-side
// hook-in for z-app and z-view elements.......
app.route("/exchange")
	.get((req, res) => {
		// Gotta do this like I did for booking.com? That felt hacky... ejs files n aw.
		// Yeah prolly the best bet for now?
	})

app.route("/exchange/:bot_name")
	.get((req, res) => {
		// HTML for bot details....
	})
	.put((req, res) => {
		registry[req.params.bot_name] = req.body;
		res.sendStatus(200); // All good, yo.
	})


app.route("/exchange/:bot_name/:session_id")
	.get((req, res) => {

	})
	.post((req, res) => {

	});
