const exec = (exp, text) => {
	let output = [];
	let results = [];
	while(results = exp.exec(text))
		output.push(results);
	return output;
};

module.exports = (expressions, map = x => x) => {
	return {
		exec: text => {
			let output = [];
			expressions.forEach(exp => output = output.concat(exec(exp, text)));
			return output.map(map);
		},
		test: text => expressions
			.map(exp => exp.test(text)).includes(true)
	};
}
