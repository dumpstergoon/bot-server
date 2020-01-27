// @ts-nocheck
const {
	readFileSync,
	writeFile,
	unlink
} = require("fs");
const {
	execSync
} = require("child_process");
const {
	create,
	stringify
} = require("../utils");

const DO_NOTHING = (x => x);
const MAKE_NOTHING = (id => {});
const FUNCTIONS = [
	'update',
	'save',
	'clear',
	'delete'
];

const create_directory = path =>
	execSync(`mkdir -p ${path}`);

const touch_file = path =>
	execSync(`touch ${path}`);

const store = (path, _default = {}, _pivot = path.lastIndexOf('/')) => {
	create_directory(path.substring(0, _pivot));
	touch_file(path);

	let data = readFileSync(path, {
		encoding: 'utf-8'
	});

	// Yeah, need to rethink this storage thing....
	// I think at this tier, we remove the proxy
	// the proxy is getting in our way.

	// OR, we keep this the exact same, and we just use the constructor
	// to wrap whatever we pull. That's not a bad idea either...
	let store = new Proxy(create(
		data = data === "" ? _default : JSON.parse(data),
		{
			update(table) {
				for (const key in table)
					this[key] = table[key];
				return this.save();
			},
			save() {
				writeFile(path, stringify(this) + '\n', DO_NOTHING);
				return true;
			},
			delete() {
				unlink(path, DO_NOTHING);
				return true;
			},
			clear(_self = this) {
				Object.keys(_self).forEach(key => delete _self[key]);
				this.save();
			},
		}
	), {
		get(registry, id) {
			if (FUNCTIONS.includes(id))
				return registry[id];
			return Reflect.get(registry, id);
		},
		set(registry, id, data) {
			return id !== "update" &&
				Reflect.set(registry, id, data) &&
					registry.save();
		},
		deleteProperty(registry, id) {// Let's make sure our path exists!
			return Reflect.deleteProperty(registry, id) && registry.save();
		}
	});

	store.save();
	return store;
};

module.exports = {
	store: store,
	directory: (path, constructor = MAKE_NOTHING) => {
		create_directory(path);
		return new Proxy(
			{}, {
				set(collection, id, data) {
					if (!Reflect.has(collection, id))
						return collection[id] = store(`${path}/${id}.json`, data);
					return collection[id].update(data);
				},
				deleteProperty(collection, id) {
					return Reflect.has(collection, id) &&
						Reflect.get(collection, id).delete() &&
							Reflect.deleteProperty(collection, id);
				}
			}
		);
	},
};
