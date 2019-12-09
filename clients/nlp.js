// @ts-nocheck
const client = require("./client");
module.exports = interpreter_name =>
	client(`${process.env.NLP || "http://localhost:8080"}/${interpreter_name}`);
