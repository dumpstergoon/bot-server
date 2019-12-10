module.exports = (
	_timestamp,
	message = "",
	state = {},
	confidence = 1,
	idontknow = confidence < 0.5,
	component_done = confidence === 0,
	component_failed = confidence === -1) => {
	return {
		response: message,
		response_time: (Date.now() - _timestamp) / 1000,
		confidence: confidence,
		idontknow: idontknow,
		out_of_context: idontknow,
		component_done: component_done,
		component_failed: component_failed,
		updated_context: state,
	};
};
