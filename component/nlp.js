// @ts-nocheck
// Compromise NLP:
const nlp = require("compromise");
// We also want to be able to dissect text-based numbers
nlp.extend(require("compromise-numbers"));


module.exports = (text, _doc = nlp(text)) => {
	_doc.contractions().expand();
	return 
}; // TODO: We'll abstract this a bit to auto-handle contractions 'n' shit
