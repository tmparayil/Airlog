var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var usageHistorySchema = new Schema({
	user		:	String,
	path		:	String,
	startTime	:	Number,
	endTime		:	Number
},{collection:'usageHistory'});

module.exports = mongoose.model('usageHistory',usageHistorySchema);
