var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var usageDetailsSchema = new Schema({
	name		:	String,
	time		:	Number,
	feedback	:	String,
	rating		:	Number
},{collection:'userFeedback'});

module.exports = mongoose.model('userFeedback',usageDetailsSchema);
