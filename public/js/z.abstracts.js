// @ts-nocheck
/*
	Here, we gonna define some abstracts. Some might get worked into z core.
	Some might go from the core to out here. We'll see...
*/
z.abstracts = z.define(abstracts => {
	const delta = (x1, y1, x2, y2) => {
		return {
			x: x2 - x1,
			y: y2 - y1
		};
	};

	return {
		Viewable: z.abstract({
			display: z.property.options([
				'block',
				'inline-block',
				'flex',
				'flexbox',
				//...
			]),
			visible: z.attribute.boolean(false, (element, change) => {
				if (change.to)
					element.style.display = element.display;
				else
					element.listen_once("transitionend", e => {
						console.log('TRANSITIONEND:', e);
						if (!change.to)
							element.style.display = 'none';
					});
			}),
			connected: z.listener(element =>
				element.display = element.styles.display),

			opacityrun: z.listener(() => {
				console.log('à partier', 'Est-ce que ça marche là?');
			}),
			opacityend: z.listener(() => {
				console.log('à finir', 'Est-ce que ça marche là?');
			}),
		}),

		Selectable: z.abstract({
			selected: z.attribute.boolean(false, (element, change) =>
				element.dispatch(change.to ? "selected" : "unselected"))
		}),

		Activatable: z.abstract({
			enabled: z.attribute.boolean(true, (element, change) =>
				element.dispatch(change.to ? "enabled" : "disabled"))
		}),

		Updatable: z.abstract({
			state: z.attribute.options([
				'connecting',
				'updating',
				'updated',
				'broken',
				'stale',
				'idle'
			], (element, change) => element.dispatch(change.to))
		}),


		Template: z.abstract({
			template: z.property.type.function(),
			connected: z.listener(element => {
				element.render_me(element);
			}),
			render_me() {
				this.innerHTML = this.template(this)
					.replace(/[\s]+</gi, '<')
					.replace(/>[\s]+/gi, '>');
			}
		}),

		List: z.abstract({
			*[Symbol.iterate]() {
				let items = this.children
					.filter(abstracts.ListItem.is_inherited);
				for (let x in items)
					yield x;
			},
			push(...items) {
				items.forEach(item => this.append(item));
			},
			clear() {
				// Let us get rid of our ListItems...
				[...this].forEach(item => item.parent.removeChild(item));
			},
			set(...items) {
				this.clear();
				this.push(...items);
			}
		}),

		ListItem: z.abstract({
			order: z.css.integer(),
			connected: z.listener((item, event) => {
				item.order = [...item.parent].indexOf(item);
			}),
		}),

		Interval: z.abstract({
			stamp: z.property.type.integer(Date.now()),
			interval: z.property.type.integer(0),
			render: z.listener(element => {
				if (element.interval < 10)
					return;
				let now = Date.now();
				if (now - element.stamp >= element.interval) {
					element.stamp = now;
					element.dispatch('interval', {}, false, false);
				}
			}),
			stop() {
				this.interval = 0;
			}
		}),

		Iterator: z.abstract({
			index: z.attribute.integer(0),
			next() {
				let cur = this.index;
				let items = this.children;
				
				if (cur >= items.length - 1)
					return this.index = 0 || null;
				
				let item = items[curr];
				this.index = curr + 1;
				return item;
			}
		}),

		Vector: z.abstract({
			x: z.css.number(0),
			y: z.css.number(0)
		}),

		Moveable: z.abstract({
			moving: z.attribute.boolean(false),
			origin: z.property.type.list([0, 0]).private(), // TODO: make a vector model.

			mousedown: z.listener((element, event) => element.drag(event)),
			mouseup: z.listener((element, event) => element.drop(event)),
			mousemove: z.listener((element, event) => element.follow(event)),
			touchstart: z.listener((element, event) => element.drag(event)),
			touchend: z.listener((element, event) => element.drop(event)),
			touchmove: z.listener((element, event) => element.drop(event)),
			
			drag(event) {
				this.moving = true;
				this.origin = [event.clientX, event.clientY];
				this.dispatch('movestart');
			},
			follow(event, origin = this.origin) {
				this.dispatch('movefollow', delta(
					origin[0],
					event.clientX,
					origin[1],
					event.clientY));
			},
			drop(event) {
				this.moving = false;
				this.dispatch('movestop');
			}
		}, "Vector"),
		
		Icon: z.abstract({
			icon: z.attribute.string("", (element, from, to) => {
				console.log(abstracts.Icon, abstracts.Icon.path);
				element.url = to ? `url("${abstracts.Icon.path + to}.svg")` : "";
			}),
			url: z.css.string(),
		}).static({
			path: z.property.type.string("/assets/icons/"),
		}),
	};
});
