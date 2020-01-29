// @ts-nocheck
const nlp = require("compromise");
nlp.extend(require("compromise-numbers"));
module.exports = (text, _doc = nlp(text)) => {
	_doc.contractions().expand();
	return 
}; // TODO: We'll abstract this a bit to auto-handle contractions 'n' shit
