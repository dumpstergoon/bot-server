// @ts-nocheck
const {
	readFileSync,
	writeFile
} = require("fs");
const {
	execSync
} = require("child_process");
const {
	create,
	parse,
	stringify
} = require("../utils");

const DO_NOTHING = (x => x);

module.exports = {
	store: (path, _pivot = path.lastIndexOf('/')) => {
		// Let's make sure our path exists!
		execSync(`mkdir -p ${path.substring(0, _pivot)}`);
		// Let's make sure our file exists.
		execSync(`touch ${path}`);

		let data = readFileSync(path, {
			encoding: 'utf-8'
		});

		return new Proxy(create(
			data = data === "" ? {} : JSON.parse(data),
			{
				save() {
					writeFile(path, stringify(this), DO_NOTHING);
					return true;
				}
			}
		), {
			set(registry, id, data) {
				return Reflect.set(registry, id, data) && registry.save();
			},
			deleteProperty(registry, id) {
				return Reflect.deleteProperty(registry, id) && registry.save();
			}
		});
	}
};
