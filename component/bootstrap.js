// @ts-nocheck

module.exports = bot => {
	if (process.send) {
		console.log("PROCESS STARTED...");
		bot.send = response => {
			process.send(JSON.stringify(response));
		};
		process.on('message', (message, payload = JSON.parse(message)) => {
			bot.receive(payload.session_id, payload.user_input, payload.context);
		});
	} else {
		const io = require("readline").createInterface({
			input: process.stdin,
			output: process.stdout
		});
	
		const args = process.argv.slice(2);
		const session_id = args[0] || "kweek";
		const context = JSON.parse(args[1] || "{}");
	
		const prompt = (callback, text = 'user input') =>
			io.question(text + ': ', callback);
	
		const input_prompt = text => prompt(msg => {
			bot.receive(session_id, msg, context);
		}, text);
	
		bot.send = response => {
			console.log(response.response);
			if (!response.component_done)
				input_prompt();
			else
				console.log("ALL DONE.");
		};
	
		input_prompt("Type to get started");
	}	
};
