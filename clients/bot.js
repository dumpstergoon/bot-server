// @ts-nocheck
const client = require("./client");
module.exports = (bot_name, session_id) =>
	client(`${process.env.BOT || "http://localhost:3000"}/${bot_name}/${session_id}`);
