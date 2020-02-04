// @ts-nocheck
const z = (_global => {
	/*
		Constants and Symbols for days...
	*/
	const NAME = Symbol("type name");
	const TYPE = Symbol("type template");
	const SATISFIES = Symbol("type compare");

	const ABSTRACT = Symbol("abstract meta type");
	const STATIC = Symbol("static meta type");
	const MODEL = Symbol("model meta type");
	const ELEMENT = Symbol("element meta type");

	const PROPERTY = Symbol("property meta type");
	const ATTRIBUTE = Symbol("dom attribute meta type");
	const CSS_VAR = Symbol("css variable meta type");
	const DOM = Symbol("dom meta tye");
	const LISTENER = Symbol("dom listener meta type");
	const TEMPLATE = Symbol("html template meta type");

	const DO_NOTHING = (x => x);
	const ALWAYS_TRUE = (() => true);
	const RETURN_EMPTY_LIST = (() => []);

	const CONNECTED = Symbol("connected");
	const CHANGESET = Symbol("changeset");
	const LISTENERS = Symbol("listeners");

	const HEX_DIGITS = '0123456789abcdef';

	const EVENT = {
		CONNECTED: "connected",
		DISCONNECTED: "disconnected",
		RENDER: "render",
		READY: "ready"
	};

	const CHANGESET_HANDLER = {
		set(store, name, change) {
			return Reflect.set(store, name, Reflect.has(store, name) ? concat(Reflect.get(store, name), {
				to: change.to
			}) : change);
		}
	};

	const DEFAULT_PROTOTYPE = {
		[SATISFIES](template) {
			return satisfies(this[TYPE], template);
		},
		satisfies(type) {
			return satisfies(this[TYPE], type);
		},
		define(...definitions) {
			return define_properties(this, concat(...definitions));
		},
		super(type) {
			return extend((...args) => {
				return type.prototype.constructor.call(this, ...args);
			}, proxy_map(type.prototype, ƒ => ƒ.bind(this)));
		},
		keys() {
			return keys(this);
		},
		entries() {
			return rows(this);
		},
		values() {
			return Object.values(this);
		},
		map(mapper) {
			return map(this, mapper);
		},
		forEach(iterator) {
			return rows(this).forEach(iterator) || this;
		},
		filter(_filter) {
			return filter(this, _filter);
		},
		proxy(handler) {
			return proxy(this, handler);
		},
		toString() {
			return `[OBJECT] ${this[NAME] || "anonymous"}`;
		}
	};


	/*

		Core utility functions for manipulating objects.
		Some of these shall be added to object prototypes.

	*/
	const keys = obj => Object.keys(obj);
	const rows = obj => Object.entries(obj).
		concat(Object.getOwnPropertySymbols(obj).map(symbol => [symbol, obj[symbol]]));
	const object = rows => rows.reduce((obj, [key, value]) => {
		obj[key] = value;
		return obj;
	}, {});
	const extend = (...objects) => Object.assign(...objects);
	const concat = (...objects) => extend({}, ...objects);
	const apply = (obj = {}, properties = {}) => rows(properties).forEach(([key, value]) => obj[key] = value) || obj;
	const copy = extend(
		value => Type.object(value) ?
			(Type.array(value) ?
				copy.array(value) : copy.object(value)) : value,
		{
			object: obj => object(rows(obj).map(([key, value]) => [key, copy(value)])),
			array: array => array.map(value => copy(value))
		}
	);
	const merge = (...items) => {
		let target = {};
		items = items.map(item => rows(item));
		items.shift().concat(...items)
			.forEach(([key, value]) => {
				target[key] = (target[key] || []).concat(value);
		});
		return target;
	};
	const filter = (obj, filter) => object(rows(obj).filter(filter));
	const map = (obj, mapper) => object(rows(obj).map(mapper));
	const satisfies = (a, b) => a === b || a.parents.some(c => satisfies(c, b));
	const create = (properties = {}, prototype = {}) => Object.create(concat(DEFAULT_PROTOTYPE, prototype), properties);
	const define_properties = (obj, definition) => Object.defineProperties(obj, object(rows(definition).map(([name, value]) => {
		return [
			name,
			Type.meta.property(value) ? value : {
				value: value
			}
		];
	})));
	// ***this could be a great abstraction for plugins/extensions....
	const define_accessors = (accessors, get = DO_NOTHING, set = DO_NOTHING) => {
		return map(accessors, ([name, accessor]) => {
			return [
				name,
				concat(getset(
					element => get(element, accessor, name),
					(element, value) => set(element, accessor, name, value)
				), {
					enumerable: true,
					configurable: false
				})
			];
		});
	};
	const define_attributes = attributes => {
		return define_accessors(
			attributes,
			(element, attribute) => attribute.property.get.call(element),
			(element, attribute, name, value) => {
				let from = attribute.get(element.getAttribute(name));
				if (Type.date(value) && from.getTime() === value.getTime())
					return value;
				if (from !== value) {
					element[CHANGESET][name] = {
						from: from,
						to: value
					};
					element.setAttribute(
						name,
						attribute.set(attribute.property.set.call(element, value))
					);

					if (!element[CONNECTED])
						element.render();

					return value;
				}
			}
		);
	};
	const define_variables = variables => {
		return define_accessors(
			variables,
			(element, variable) => variable.property.get.call(element),
			(element, variable, name, value) => {
				name = '--' + name;
				let style = getComputedStyle(element);
				let from = style.getPropertyValue(name);
				if (from !== value) {
					element.style.setProperty(
						name,
						variable.set(variable.property.set.call(element, value))
					);
					variable.render(element, from, value);
					element.dispatch(name, {}, false, false);
				}
				return value;
			}
		);
	};
	const define_queries = queries =>
		define_accessors(
			queries,
			(element, query) =>
				Array.from(element.querySelectorAll(query.query))
					.filter(node => query.recursive || node.parentNode === element)
		);


	const namespace = (spaces = [], target = _global) => spaces.length === 0 ? target : namespace(spaces.slice(1), target[spaces[0]]);
	const proxy = (object, handler) => new Proxy(object, handler);
	const proxy_map = (object, get = DO_NOTHING, set = DO_NOTHING) => proxy(object, {
		get(object, key) {
			return get(Reflect.get(object, key));
		},
		set(object, key, value) {
			return Reflect.set(object, key, set(value));
		}
	});
	const enumm = list => object(list.map(item => [item, Symbol(item)]));
	const getset = (get, set) => {
		return {
			get() {
				return get(this, ...arguments);
			},
			set() {
				return set(this, ...arguments);
			}
		};
	};
	const changeset = () => proxy({}, CHANGESET_HANDLER);
	const event = (name, data = {}, bubbles = true, cancelable = true) => extend(new Event(name, {
		bubbles: bubbles,
		cancelable: cancelable
	}), data);
	
	extend(Array.prototype, {
		to_object() {
			return object(this);
		}
	});
	// TODO: This is a temporary fix. Need something better.
	extend(Function.prototype, {
		toStr: Function.prototype.toString,
		toString() {
			let original = this.toStr();
			return `[FUNCTION] ${original.substring(
				original.indexOf("function") === 0 ? 8 : 0,
				original.indexOf('{')).trim()}`;
		}
	});
	// TODO: Same here...
	extend(Symbol.prototype, {
		toStr: Symbol.prototype.toString,
		toString(description = this.toStr()) {
			return description.substring(7, description.length - 1);
		}
	});


	/*

		Next we got ourselves our functions for creating templates and their instances.

	*/
	const slots = (slots, filler = RETURN_EMPTY_LIST) => (new Array(slots)).fill(filler());
	const sort = (list, sorter, num_of_slots) => (list.constructor === Array ? list : rows(list)).reduce((store, item, index, list) => {
		return store[sorter(item, index, list)].push(item) && store;
	}, slots(num_of_slots));
	const sort_definition = definition => sort(definition, ([key, value]) => Type.meta.property(value) ? 1 : 0, 2).map(object);


	const define = (ƒmodels, _target = {}, _models = ƒmodels(_target)) => {
		rows(_models).forEach(([name, model]) => {
			if (Type.meta.model(model) || Type.meta.element(model)) {
				let temp = template(
					name,
					model[TYPE],
					model.self,
					model.definition,
					...model.parents.map(parent => {
						return Type.string(parent) ? _target[parent] : parent;
					}),
				);
				_target[temp.type] = temp;
			} else
				_target[name] = model;
		});
		return _target;
	};

	const template = (name, type, static, definition, ...templates) => {
		// Should we map plain values in the definition as static properties?
		// definition = map(definition, ([key, value]) =>
		// 	[key, !Type.function(value) && !Type.raw(value) ? property.value(value) : value]
		// );
		let template;
		let defaults = filter(
			definition,
			([key, value]) =>
				!Type.function(value) && !Type.raw(value));
		let prototype = filter(
			definition,
			([key, value]) =>
				Type.function(value) && !Type.meta.listener(value));
		let listeners = filter(
			definition,
			([key, value]) => Type.meta.listener(value));
		let properties = filter(
			definition,
			([key, value]) => Type.raw(value));

		if (type === ELEMENT) {
			name = name.toLowerCase();
			template = values => apply(document.createElement(name, defaults.extends ? {
				extends: defaults.extends
			} : undefined), concat(defaults, values));
		} else if (type !== ABSTRACT) {
			template = (...arguments) => {
				let object = create(concat(template.prototype, {
					constructor: template,
				}), template.properties);
				if (template.prototype.constructor)
					return template.prototype.constructor.apply(object, arguments) || Object.seal(object);
				return Object.seal(apply(object, arguments[0] || {}));
			};
		}

		template = extend(define_properties(template || {}, static), {
			type: name,
			parents: templates,
			listeners: merge(...templates.map(template => template.listeners), listeners),
			properties: concat(...templates.map(template => template.properties), properties, {
				[NAME]: property.value(name),
				[TYPE]: property.value(template)
			}),
			prototype: concat(...templates.map(template => template.prototype), prototype),
			[TYPE]: type,
			is_inherited(instance) {
				return satisfies(instance[TYPE], template);
			},
			toString() {
				return `[TEMPLATE - ${type.toString()}] ${this.type}`;
			}
		});
		
		if (type === ELEMENT)
			customElements.define(template.type, generate_element_class(template, defaults.extends));
			
		if (type === STATIC)
			return template();
		return template;
	};

	const model = (definition, ...parents) => {
		return {
			definition: definition,
			parents: parents,
			self: {
				empty() {
					return this();
				}
			},
			[TYPE]: MODEL,
			static(definition) {
				let [prototype, properties] = sort_definition(definition);
				return extend(this.self, create(properties), prototype) && this;
			}
		};
	};

	const abstract = (definition, ...parents) => {
		return extend(model(definition, ...parents), {
			[TYPE]: ABSTRACT
		});
	};

	const static = (definition, ...parents) => {
		return extend(model(definition, ...parents), {
			[TYPE]: STATIC
		});
	};

	const element = (definition, ...parents) => {
		return extend(model(definition, ...parents), {
			[TYPE]: ELEMENT
		});
	};

	// Need to rethink our property system such that attributes and css variables
	// access the appropriate methods of elements from here instead.
	const property = extend((descriptor, enumerable = true, configurable = false) => {
		return concat({
			enumerable: enumerable,
			configurable: configurable,
			[TYPE]: PROPERTY,
			private() {
				this.enumerable = false;
				delete this.private;
				return this;
			}
		}, descriptor);
	}, {
		value(value = null, writable = false, private = false) {
			return property({
				value: value,
				writable: writable
			}, !private)
		},
		variable(value = null, private = false) {
			return property.value(value, true, private);
		},
		getset(getter = DO_NOTHING, setter = DO_NOTHING, private = false) {
			return extend(property(getset(getter, setter), private), {
				intercept(intercept) {
					return extend(this, {
						get() {
							return intercept.get ? intercept.get(getter(this)) : getter(this);
						},
						set(value) {
							return setter(this, intercept.set ? intercept.set(value) : value);
						}
					});
				}
			});
		},
		getter(get = DO_NOTHING, private = false) {
			return property.getset(
				get,
				DO_NOTHING,
				private
			);
		},
		validated(validator = ALWAYS_TRUE, get = DO_NOTHING, set = DO_NOTHING, error = DO_NOTHING, private = false) {
			return property.getset(get, (object, value) => {
				return (validator(value) ? set(object, value) : error(object, value)) || value;
			}, private);
		},
		type: extend((initial = null, validator = ALWAYS_TRUE, render = DO_NOTHING, _pointer = Symbol()) => {
			let resolve_value = (object, _value = object[_pointer]) =>
				Type.undefined(_value) ? object[_pointer] = initial : _value;

			return property.validated(
				validator,
				resolve_value,
				(object, value) => {
					let from = resolve_value(object);
					let to = object[_pointer] = value;
					if (from !== to)
						render(object, from, to);
					return value;
				},
				(object, value) => Error.type(value), // TODO: pass object
			);
		}, {
			any: (value = null, render) => property.type(value, ALWAYS_TRUE, render),
			boolean: (value = false, render) => property.type(value, Type.boolean, render),
			char: (value = '', render) => property.type(value, x => Type.string(x) && x.length === 1, render),
			string: (value = "", render) => property.type(value, Type.string, render),
			number: (value = 0, render) => property.type(value, Type.number, render),
			integer: (value = 0, render) => property.type(value, Type.integer, render),
			float: (value = 0.0, render) => property.type(value, Type.float, render),
			list: (value = [], render) => property.type(value, Type.array, render),
			date: (value = new Date(), render) => property.type(value, Type.date, render),
			function: (value = DO_NOTHING, render) => property.type(value, Type.function, render),
			object: (value = {}, render) => property.type(value, Type.object, render),
		}),
		object: (type, value) => property.type(value || type.empty ? type.empty() : type(), value => Type.has_interface(value, type)),
		options: (options, render) => property.type(options[0], value => options.includes(value), render),
	});

	const attribute = extend((property, get = DO_NOTHING, set = DO_NOTHING, render = DO_NOTHING) => {
		return {
			property: property,
			get: get,
			set: set,
			render: render,
			[TYPE]: ATTRIBUTE,
			required() {
				this.required = true;
				return this;
			},
			nullable() {
				this.nullable = true;
				return this;
			}
		};
	}, {
		boolean: (value, render) => attribute(
			property.type.boolean(value),
			IO.parse.boolean,
			IO.serialize.boolean,
			render
		),
		char: (value, render) => attribute(
			property.type.char(value),
			DO_NOTHING,
			DO_NOTHING,
			render
		),
		string: (value, render) => attribute(
			property.type.string(value),
			DO_NOTHING,
			DO_NOTHING,
			render
		),
		integer: extend((value, render) => attribute(
			property.type.integer(value),
			IO.parse.integer,
			DO_NOTHING,
			render
		), {
			range: (lower, upper, render) => attribute(
				
			),
		}),
		float: (value, places, render) => attribute(
			property.type.float(value),
			IO.parse.float,
			IO.serialize.float(places),
			render
		),
		number: (value, render) => attribute(
			property.type.number(value),
			IO.parse.float,
			DO_NOTHING,
			render
		),
		list: (value, render, delimeter = ',') => attribute(
			property.type.array(value),
			IO.parse.list(delimeter),
			IO.serialize.list(delimeter),
			render
		),
		date: (value, render) => attribute(
			property.type.date(value),
			string => new Date(string),
			date => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toJSON(),
			render
		),
		time: (value, render) => attribute.list(value, render, ':'),
		set: (value, render) => attribute.list(value, render, ' '),
		hset: (value, render) => attribute(
			property.type.object(value),
			string => string ? string.trim().split(';').map(pair => pair.trim().split(':')) : {},
			object => rows(object).map(([key, value]) => `${key.trim()}:${value.trim()}`).join(';'),
			render
		),
		options: (values, render) => attribute(
			property.options(values),
			DO_NOTHING,
			DO_NOTHING,
			render
		)
	});

	const css = extend((property, get = DO_NOTHING, set = DO_NOTHING, render = DO_NOTHING) => {
		return {
			property: property,
			get: get,
			set: set,
			render: render,
			[TYPE]: CSS_VAR
		}
	}, {
		string: (value, render) => css(
			property.type.string(value),
			DO_NOTHING,
			DO_NOTHING,
			render
		),
		integer: (value, render) => css(
			property.type.integer(value),
			IO.parse.integer,
			DO_NOTHING,
			render
		),
		float: (places, value, render) => css(
			property.type.float(places, value),
			IO.parse.float,
			IO.serialize.float(places),
			render
		),
		number: (value, render) => css(
			property.type.number(value),
			IO.parse.number,
			DO_NOTHING,
			render
		),
		unit: extend((unit, value, render) => {
			return css(
				property.type.number(value, render),
				IO.parse.number,
				number => number + unit
			);
		}, {
			px: (value, render) => css.unit('px', value, render),
			pt: (value, render) => css.unit('pt', value, render),
			em: (value, render) => css.unit('em', value, render),
			vw: (value, render) => css.unit('vw', value, render),
			vh: (value, render) => css.unit('vh', value, render),
			per: (value, render) => css.unit('%', value, render)
		}),
		factor: (value, render) => css(
			property.type.integer(value, render),
			string => IO.parse.number(string) * 100,
			number => (number / 100)
		),
		options: values => css(property.options(values, render)),
	});

	const dom = extend(getter =>{
		return extend(property.getter(getter), {
			first() {
				delete this.first;
				this.intercept({
					get: value => console.log('!!', value) || Type.array(value) ? value[0] : value,
				});
			}
		});
	}, {
		by_id: id => property.getter(element =>
			element.getElementById(id)),
		by_tag: tag => property.getter(element =>
			Array.from(element.getElementsByTagName(tag))),
		by_class: class_name => property.getter(element =>
			Array.from(element.getElementsByClassName(class_name))),
		by_type: type => dom.by_class(Type.string(type) ? type : type.type),
		query: selector => property.getter(element =>
			Array.from(element.querySelector(selector))),
		filter: extend(filter => property.getter(element => element.children.filter(filter)), {
			by_type: (type, _type = Type.string(type) ? type : type.type) =>
				dom.filter(child => child.className.contains(_type))
		}),
	});

	const listener = callback => {
		return extend(callback, {
			[TYPE]: LISTENER
		})
	};

	const operation = (target, source, operation) => rows(source).forEach(x => operation(target, x));
	const do_listeners = (target, source, callback) => operation(target, source, (target, [event_name, listener]) => {
		let chunks = event_name.split('.');
		event_name = chunks.pop();
		callback(chunks.length > 0 ? namespace(...chunks) : target, event_name, listener);
	});
	const append_listeners = (target, source) => do_listeners(target, source, (target, event_name, listener) => {
		target.addEventListener(event_name, listener, false);
	});
	const remove_listeners = (target, source) => do_listeners(target, source, (target, event_name, listener) => {
		target.removeEventListener(event_name, listener, false);
	});
	const transition_relay = (target, position)  => {
		target.addEventListener('transition' + position, e => {
			target.dispatch(e.propertyName + position);
		}, false);
	};

	const generate_element_class = (template, base) => {
		// TODO: Open-up the sorting of properties so we can easily extend it.
		// TODO: abstract these into single function.
		let _properties = filter(
			template.properties,
			([key, value]) => value[TYPE] !== ATTRIBUTE);
		let _attributes = filter(
			template.properties,
			([key, value]) => value[TYPE] === ATTRIBUTE);
		let _variables = filter(
			template.properties,
			([key, value]) => value[TYPE] === CSS_VAR);
		let _listeners = template.listeners;
		let _prototype = filter(
			template.prototype,
			([key, value]) => value[TYPE] !== LISTENER);
		
		let document_loaded = false;

		let element = class extends (base || HTMLElement) {
			get styles() {
				return proxy(this.getComputedStyle(element), {
					get(style, name) {
						return style.getPropertyValue(name);
					},
					set(style, name, value) {
						// Do I do this over cssText? Perhaps both?
						return style.setProperty(name, value);
					}
				})
			}
			constructor() {
				super();

				this[CONNECTED] = false;
				this[CHANGESET] = changeset();
				this[LISTENERS] = object(rows(_listeners).map(([event_name, listeners]) => {
					let element = this;
					return [
						event_name,
						extend(event => {
							listeners.map(listener => listener(element, event));
						}, listener)
					];
				}));

				Object.defineProperties(this, concat(
					_properties,
					define_attributes(_attributes),
					define_variables(_variables),
					//define_queries(_queries),
					{
						parent: property.getter(element => element.parentNode),
						children: property.getter(element =>
							Array.from(element.childNodes)
								.filter(child => child.nodeType === 1)),
					}
				));

				if (template.prototype.constructor)
					template.prototype.constructor.call(this);
				
				['run', 'end'].forEach(pos => transition_relay(this, pos));
			}
			connectedCallback() {
				this[CONNECTED] = true;

				if (document_loaded)
					this.dispatch('ready', {}, false, false);
				else {
					window.addEventListener('load', e => {
						document_loaded = true;
						setTimeout(() => {
							this.dispatch('ready', {}, false, false);
						}, 1200);
					}, false);
				}

				this.className = template.parents.map(template => template.type).concat(template.type).join(' ');

				rows(_attributes).forEach(([name, attribute]) => {
					let value = this.getAttribute(name);

					if (Type.string(value))
						attribute.property.set.call(this, value = attribute.get(value));
					else {
						if (attribute.required === true)
							return Error.required(this, name);
						this.setAttribute(name, attribute.set(value = attribute.property.get.call(this)));
					}
					attribute.render(this, {
						from: value,
						to: value
					});
				});

				append_listeners(this, this[LISTENERS]);
				this.dispatch(EVENT.CONNECTED, {}, false, false);
				this.render();
			}
			disconnectedCallback() {
				this[CONNECTED] = false;
				remove_listeners(this, this[LISTENERS]);
				this.dispatch(EVENT.DISCONNECTED, {}, false, false);
			}
			render(ts = -1) {
				this.dispatch(EVENT.RENDER, {}, false, false);
				
				rows(_attributes).forEach(([name, attribute]) => {
					let previous = attribute.property.get.call(this);
					let value = attribute.get(this.getAttribute(name));

					if (Type.date(value) && previous.getTime() === value.getTime())
						return;

					if (value !== previous) {
						attribute.property.set.call(this, value);
						this[CHANGESET][name] = {
							from: previous,
							to: value
						};
					}
					
					let change = this[CHANGESET][name];
					if (change) {
						attribute.render(this, change);
						this.dispatch(`@${name}`, change, false);
					}
				});

				this[CHANGESET] = changeset();
				
				if (!this[CONNECTED])
					return;
				
				requestAnimationFrame(ts => this.render.call(this, ts));
			}
		};
		return extend(element.prototype, DEFAULT_PROTOTYPE, _prototype, {
			dispatch() {
				this.dispatchEvent(event(...arguments));
			},
			listen() {
				this.addEventListener(...arguments, false);
			},
			listen_once(name, listener, otherthing, _self = this) {
				_self.addEventListener(name, function onetimer(event) {
					listener.call(_self, event);
					_self.removeEventListener(name, onetimer, otherthing);
				}, otherthing);
			},
			append() {
				this.appendChild(...arguments);
			},
			toString() {
				return `[ELEMENT] ${this[NAME]}`;
			}
		}) && element;
	};

	const math = {
		random: extend((a = 0, b = 1) => {
			return (Math.random() * (b - a)) + a;
		}, {
			range: (a, b) => Math.round(math.random(a, b)),
			item: (list, lower = 0, upper = list.length - 1) =>
				list[math.random.range(lower, upper)],
			boolean: (_values = [true, false]) => math.random.item(_values),
			hex_digit: (lower = 0, upper = HEX_DIGITS.length - 1) =>
				math.random.item(HEX_DIGITS, lower, upper),
			hex_string: (digits = 10) => {
				let hexstring = "";
				for (let i = 0; i < digits; i++)
					hexstring += math.random.hex_digit();
				return hexstring;
			},
		}),
		time: (() => {
			const s_p_m = 60; // => seconds / minute
			const m_p_h = 60; // => minutes / hour
			const h_p_d = 24; // => hours / day
			
			const s = 1000; // => ms / second
			const m = s * s_p_m; // => ms / minute
			const h = m * m_p_h; // => ms / hour
			const d = h * h_p_d; // => ms / day

			const unit_factors = [d, h, m, s, 1];
			const conversion_factor = [0, h_p_d, m_p_h, s_p_m, s];

			const multiple = (ms, msper) => Math.floor(ms / msper);
			const fragment = (multiple, offset) => multiple - offset;

			return {
				span: (ms, output = []) => {
					unit_factors.reduce((previous, unit_factor, index) => {
						let mult = multiple(ms, unit_factor);
						output.push(
							fragment(
								mult,
								previous * conversion_factor[index]));
						return mult;
					}, 0);
					return output;
				}
			}
		})(),
	};

	const Type = extend(
		object([
			"undefined",
			"boolean",
			"function",
			"object",
			"number",
			"bigint",
			"string",
			"symbol",
		].map(type_name => [type_name, value => typeof value === type_name])),
		{
			integer: x => Number.isInteger(x),
			float: x => Type.number(x) && !Type.integer(x),

			constructor: (x, X) => x.constructor === X,
			raw: x => Type.constructor(x, Object),
			array: x => Type.constructor(x, Array),
			date: x => Type.constructor(x, Date),

			meta: extend((x, types) => types.includes(x[TYPE]), {
				any: x => Type.meta([PROPERTY, ATTRIBUTE, CSS_VAR, QUERY, LISTENER, MODEL, ELEMENT]),
				property: x => Type.meta(x, [PROPERTY, ATTRIBUTE, CSS_VAR]),
				attribute: x => Type.meta(x, [ATTRIBUTE]),
				css_var: x => Type.meta(x, [CSS_VAR]),
				query: x => Type.meta(x, [QUERY]),
				listener: x => Type.meta(x, [LISTENER]),
				model: x => Type.meta(x, [MODEL, STATIC, ABSTRACT]),
				element: x => Type.meta(x, [ELEMENT]),
			}),

			has_interface: (x, X) => x[SATISFIES](X),
			get: value => (value).constructor,
			guess: value => {
				if (Type.undefined(value))
					return "undefined";
				if (value instanceof HTMLElement)
					return value.toString();
				if (value[TYPE])
					return value[TYPE].toString();
				if (Type.number(value))
					return Type.integer(value) ? "integer" : Type.float(value) ? "float" : "number";
				if (Type.object(value))
					return value.constructor ? value.constructor.name.toLowerCase() : "object"
				return typeof value;
			},
		});
	
	const IO = {
		parse: {
			boolean: string => Type.undefined(string) ? undefined : string === 'true' ? true : false,
			number: string => isNaN(string) ? undefined : parseFloat(string),
			integer: string => isNaN(string) ? undefined : parseInt(string),
			float: string => number(string),
			list: delimeter => string => string ? string.split(delimeter) : undefined,
			string: DO_NOTHING, // TODO: functions for creating string structures
		},
		serialize: {
			boolean: bool => Type.undefined(bool) ? undefined : bool ? 'true' : 'false',
			number: DO_NOTHING,
			integer: DO_NOTHING,
			float: places => float => float.toFixed(places),
			list: delimeter => list => list.join(delimeter),
			string: DO_NOTHING
		}
	};

	const Error = extend(message => {
		throw message;
	}, {
		type: value => Error(`Incorrect type. Cannot assign ${Type.guess(value)}.`),
		forbidden: message => Error("Forbidden operation.", message),
		required: (object, attribute) => Error(`${Type.guess(object)}\nValue for attribute "${attribute.toString()}" REQUIRED.`)
	});

	// Double-check our export.
	return define(lib => {
		return {
			math: math,
			extend: extend,
			concat: concat,
			copy: copy,
			apply: apply,

			define: define,
			define_properties: define_properties,
			define_attributes: define_attributes,
			property: property,
			attribute: attribute,
			css: css,
			listener: listener,


			enum: enumm,
			abstract: abstract,
			static: static,
			model: model,
			element: element,

			type: Type,
			event: event,
			error: Error,
			app: proxy({}, {
				set(apps, name, app) {
					if (Reflect.has(apps, name))
						return Error(`Web App "${name}" has already been registered.`);
					return Reflect.set(apps, name, app);
				}
			}),
		};
	});
})(this);
