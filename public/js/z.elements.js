z.elements = z.define(elements => {
	const TYPE_INTERVAL = () => z.math.range(100, 175);
	return {
		"z-char": z.element({
			value: z.attribute.string("", (element, change) =>
				element.innerText = change.to),
			
			constructor(value) {
				this.value = value;
			},
		}, z.abstracts.ListItem, z.abstracts.Viewable),

		"z-string": z.element({
			value: z.attribute.string("", (element, change) => {
				element.set(Array.from(change.to).map(char =>
					atlas["z-char"](char)))
			}),
		}, z.abstracts.List),

		"z-text": z.element({
			interval: z.listener(element => {
				let character = element.next();
				if (character) {
					character.visible = true;
					element.interval = TYPE_INTERVAL();
				} else
					element.stop();
			}),
			connected: z.listener(element => {
				element.interval = TYPE_INTERVAL();
			}),
			disconnected: z.listener(element => {
				element.stop();
			})
		}, "z-string", z.abstracts.Interval, z.abstracts.Iterator),

		// This needs to do some shit with actual inputs 'hings...
		"z-prompt": z.element({
			template: z.property.type.function(element => {
				return `<input placeholder="Type something..." type="text" />`;
			}),
			keyup: z.listener((element, event) => {
				console.log('KEY:', event);
			}),
		}, z.abstracts.Template),

		"z-chat-item": z.element({
			user: z.attribute.string().required(),
		}, z.abstracts.ListItem),

		"z-chat": z.element({
			uri: z.attribute.string().required(),
			send() {
				// This is some message that we, the user, has made
				// and are sending to Atlaas
			},
			receive() {
				// This is a message we revceive from a component endpoint.
			}
		}, z.abstracts.List),


		"z-scene": z.element({}),
		"z-face": z.element({}),
		"z-cube": z.element({
			template: z.property.type.function(element => {
				return `
					<z-face top></z-face>
					<z-face left></z-face>
					<z-face front></z-face>
					<z-face right></z-face>
					<z-face back></z-face>
					<z-face bottom></z-face>
				`;
			}),
		}, z.abstracts.Template),
	};
});
