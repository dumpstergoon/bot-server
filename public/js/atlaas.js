// @ts-nocheck
console.log(`
_______  _______  ___      _______  _______  _______ 
|   _   ||       ||   |    |   _   ||   _   ||       |
|  |_|  ||_     _||   |    |  |_|  ||  |_|  ||  _____|
|       |  |   |  |   |    |       ||       || |_____ 
|       |  |   |  |   |___ |       ||       ||_____  |
|   _   |  |   |  |       ||   _   ||   _   | _____| |
|__| |__|  |___|  |_______||__| |__||__| |__||_______|
   
`);
console.log(`(c) ${(new Date()).getFullYear()} SkyCrate Ltd.`);

class SphereClipPlanesEvaluator extends harp.TopViewClipPlanesEvaluator {
	constructor(...args) {
		super(...args);
	}
	getCameraPitch(cameraToOrigin, camera) {
		cameraToOrigin.normalize();
		const lookAt = camera.getWorldDirection(this.m_tmpVectors[1]).normalize();
		const cosAlpha1 = cameraToOrigin.dot(lookAt);

		return Math.acos(THREE.Math.clamp(cosAlpha1, -1.0, 1.0));
	}
	getTangentDistance(d, r, _epsilon = 0.000001) {
		return (d - r < _epsilon) ? 0 : Math.sqrt(d * d - r * r);
	}
	getTangentBasedFarPlane(camera, d, r, alpha) {
		const t = this.getTangentDistance(d, r);
		const te = this.getTangentDistance(r + this.maxElevation, r);
		
		return Math.cos(alpha) * (t + te);
	}
	getTiltedFovBasedFarPlane(d, r, halfFovAngle, cameraPitch) {
		const cosAlpha = Math.cos(cameraPitch + halfFovAngle);
		const dSqr = d * d;
		const t = d * cosAlpha - Math.sqrt(dSqr * cosAlpha * cosAlpha - dSqr + r * r);

		return Math.cos(halfFovAngle) * t;
	}
	evaluateClipPlanes(map) {
		if (map.projection.type === harp.ProjectionType.Spherical)
			return this.evaluateDistanceSphericalProj(map);
		else if (map.projection.type === harp.ProjectionType.Planar)
			return this.evaluateDistancePlanarProj(map);
		assert(false, "Unsupported projection type");
		return {
			...this.minimumViewRange
		};
	}
	evaluateDistanceSphericalProj(map) {
		const camera = map.camera;
		const projection = map.projection;
		const view_ranges = {
			...this.minimumViewRange
		};

		const camera_altitude = this.getCameraAltitude(camera, projection);
		view_ranges.near = camera_altitude - this.maxElevation;

		const aspect = camera.aspect > 1 ? camera.aspect : 1 / camera.aspect;
		const halfFovAngle = THREE.Math.degToRad((camera.fov * aspect) / 2);

		if (camera instanceof THREE.PerspectiveCamera)
			view_ranges.near *= Math.cos(halfFovAngle);

		const cameraToOrigin = this.m_tmpVectors[0].copy(camera.position).negate();
		const r = harp.EarthConstants.EQUATORIAL_RADIUS;
		const d = cameraToOrigin.length();

		let farPlane;
		let farMax = map.lookAtDistance * this.farMaxRatio;
		if (camera instanceof THREE.PerspectiveCamera) {
			const alpha = Math.asin(r / d);
			const cameraPitch = this.getCameraPitch(cameraToOrigin, camera);
			const modifiedAlpha = Math.abs(alpha - cameraPitch);
			const farTangent = this.getTangentBasedFarPlane(camera, d, r, modifiedAlpha);
			farPlane =
				halfFovAngle >= modifiedAlpha
					? farTangent
					: this.getTiltedFovBasedFarPlane(d, r, halfFovAngle, cameraPitch);
			farMax = Math.max(farMax, farTangent);
		} else
			farPlane = this.getOrthoBasedFarPlane(d, r);
		
		view_ranges.far = farPlane;

		// Apply the constraints.
		const farMin = camera_altitude - this.minElevation;
		view_ranges.near = Math.max(view_ranges.near, this.nearMin);
		view_ranges.far = Math.max(view_ranges.far, farMin);

		// Apply margins.
		const nearFarMargin = (this.nearFarMarginRatio * (view_ranges.near + view_ranges.far)) / 2;
		view_ranges.near = Math.max(view_ranges.near - nearFarMargin / 2, this.nearMin);
		view_ranges.far = Math.max(
			view_ranges.far + nearFarMargin / 2,
			view_ranges.near + nearFarMargin
		);

		// Set minimum and maximum view range.
		view_ranges.minimum = this.nearMin;
		view_ranges.maximum = farMax;

		return view_ranges;
	}
}

const canvas = document.getElementById("map");
const coordinates = new harp.GeoCoordinates(55.860916, -4.251433);
const options = {
	tilt: 45,
	distance: 1600,
	azimuth: 0
};

const map = new harp.MapView({
	canvas: canvas,
	theme: "styles/base.json",
	target: coordinates,
	projection: harp.sphereProjection,
	fovCalculation: {
		type: 'dynamic',
		fov: 45
	},
	// OH MY GOD THIS TOOK WAY TOO LONG.
	clipPlanesEvaluator: new SphereClipPlanesEvaluator(
		harp.EarthConstants.MAX_BUILDING_HEIGHT,
		0,
		1,
		1, // THAT'S THE MAGIC NUMBER!! (This needs to be dynamic. Let's start at 1)
		1.8
	)
});
//map.setCameraGeolocationAndZoom(coordinates, 16);
map.lookAt(coordinates, options.distance, options.tilt, options.azimuth);

const controls = new harp.MapControls(map);


const omvDataSource = new harp.OmvDataSource({
	baseUrl: "https://xyz.api.here.com/tiles/herebase.02",
	apiFormat: harp.APIFormat.XYZOMV,
	styleSetName: 'tilezen',
	maxZoomLevel: 16,
	authenticationCode: 'AKATyXd5TeGvd9nv0y_59QA',
});
map.addDataSource(omvDataSource);

const resize = () =>
	map.resize(window.innerWidth, window.innerHeight);
resize();
window.onresize = resize;


// map.addEventListener(harp.MapViewEventNames.Render, () =>
// 	map.lookAt(coordinates, Math.max(500, options.distance -= 2.5), Math.min(options.tilt += 0.01, 50), options.spin += 0.1)
// );
//map.beginAnimation();

// const platform = new H.service.Platform({
// 	'apikey': 'fubdSb4bT60JIUuVWBtsgOb5oTq4I4O7DNcot6EJXXE'
// });


const APP = document.getElementById('atlas-app');
const COMMAND = document.getElementById('atlas-command');

const atlas = z.define(atlas => {
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
	};
});
