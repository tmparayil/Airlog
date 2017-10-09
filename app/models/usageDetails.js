var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var usageDetailsSchema = new Schema({
	user		:	{type:String, index: {unique: true}},
	path		:	String,
	startTime	:	Number,
	endTime		:	Number,
	index		:	Boolean,
	search		:	Boolean,
	logService	:	Boolean
},{collection:'usageDetails'});

module.exports = mongoose.model('usageDetails',usageDetailsSchema);
