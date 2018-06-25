var mongoose = require('mongoose')
var schema=mongoose.Schema
/*
	-id
	longUrl
	shortUrl
	description
	active - boolean
	timestamp- date
	clicks
	lastAccess - timestamp
*/

var urlSchema = new schema({
	longUrl: String,
	shortUrl: String,
	description: String,
	active: Boolean,
	timeStamp: Date,
	clicks: Number,
	lastAccess: Date
})
module.exports = mongoose.model('url',urlSchema)