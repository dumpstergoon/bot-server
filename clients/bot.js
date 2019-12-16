// @ts-nocheck
const client = require("./client");
module.exports = (bot_name, session_id) =>
	client(`${process.env.BOT || "http://67.207.69.19:3000"}/${bot_name}/${session_id}`);
