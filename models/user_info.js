const get_age = (dob, _now = new Date()) => {
	let years = _now.getFullYear() - dob.getFullYear();
	let dob_month = dob.getMonth();
	let now_month = _now.getMonth();

	if (dob_month > now_month || (dob_month === now_month && dob.getDate() >= _now.getDate()))
		years -= 1;
	return years;
};

module.exports = (email, dob, gender = "", profession = "", description = "") => {
	return {
		email: email,
		birthday: dob,
		age: get_age(dob),
		gender: gender,
		profession: profession,
		description: description
	}
};
