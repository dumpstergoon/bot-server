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
			writable: true,
			value: value
		}];
	}));
};

const create = (properties, prototype) =>
	Object.create(prototype || {}, to_definition(properties || {}));

const uuid_part = () =>
	("000" + ((Math.random() * 46656) | 0).toString(36)).slice(-3);

module.exports = {
	to_map: to_map,
	to_object: to_object,
	to_definition: to_definition,
	create: create,
	constructor: (init, prototype) =>
		options => create(init(options), prototype),
	parse: req => JSON.parse(req[0]),
	stringify: msg => JSON.stringify(msg, null, 2),
	validate: (obj, schema) => true,
	generate_uuid: (_parts = 4, _output = "") => {
		for (let i = 0; i < _parts; i++)
			_output += uuid_part();
		return _output;
	}
};
