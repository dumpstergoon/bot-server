// @ts-nocheck
module.exports = new Proxy({}, {
	get(store, session_id) {
		if (!Reflect.has(store, session_id))
			Reflect.set(store, session_id, {
				session_id: session_id,
				action: "index",
			});
		return Reflect.get(store, session_id);
	},
	set(store, session_id, state) {
		return Reflect.set(store, session_id, Reflect.has(store, session_id) ?
			Object.assign(Reflect.get(store, session_id), state) :
				state); // TODO: wrap value with a default Session object
	}
});
