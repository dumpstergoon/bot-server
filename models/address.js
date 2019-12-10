module.exports = (city, country, street = "", zip = "") => {
	return {
		"city": city,
		"country": country,
		"street": street,
		"zipcode": zip
	};
};
