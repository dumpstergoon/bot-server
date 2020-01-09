// @ts-nocheck
const request = require("request");
const ømq = require("zeromq");
// Defined in a configuration file... we can
// use IPC or TCP.
const URI = "ipc://@skycrate-bot-helloworld";

async function service_loop() {
	const socket = new ømq.Reply;
	await socket.bind(URI);
	
	while (true) {
		// We wait for a bot to announce its presence
		let [bot] = JSON.parse(await socket.receive());
		// We use the bot's name to store its service info
		registry[bot.name] = {
			name: bot.name,
			uri: bot.uri
		};
		
		// Great. Now, we respond to the bot to say the registration
		// was successful.
		await socket.send(":)");
	}
};


service_loop();
