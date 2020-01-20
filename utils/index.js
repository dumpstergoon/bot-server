// @ts-nocheck
const to_map = obj => Object.entries(obj);

const to_object = (map, output = {}) => {
	map.forEach(([key, value]) => output[key] = value);
	return output;
};

const to_definition = (obj, map = to_map(obj)) => {
	return to_object(map.map(([key, value]) => {
		return [key,{
			configurable: true,
			enumerable: true,
			writable: true, // Might remove this...
			value: value
		}];
	}));
};

const create = (properties = {}, prototype = {}) =>
	Object.create(prototype, to_definition(properties));

module.exports = {
	to_map: to_map,
	to_object: to_object,
	to_definition: to_definition,
	create: create,
	parse: req => JSON.parse(req[0]),
	stringify: msg => JSON.stringify(msg, null, 2),
	validate: (obj, schema) => true
};
