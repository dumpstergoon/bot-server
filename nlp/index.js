const expression = require('./expression');
module.exports = {
	create: expression,
	yes: expression([
		/^y$/i,
		/yes|yep|yeah|yup|ye/i,
		/totally|definitely|absolutely|defo/i,
		/sure|go/i,
		/please/i,
		/oui|aye|si/i,
	]),
	no: expression([
		/^n$/i,
		/no|nah|pass|don't|cancel|forget/i,
	]),
	number: expression([
		/([0-9]+)/gi,
		/\b((twen|thir|fo[u]?r|fif|six|seven|eight|nine)(teen|ty))[\s-]?(one|two|three|four|five|six|seven|eight|nine)?\b/gi,
		/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi,
	], result => result.slice(1)),
	email: expression([
		/([\w\-]+@[\w\-]+\.[a-z]+)/gi
	], result => result[0])
};
