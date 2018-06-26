var mongoose = require('mongoose')
var schema=mongoose.Schema

var CounterSchema = new schema({
    _id: {type: String, required: true},
    seq: { type: Number, default: 0 }
},{versionKey: false});
var counter = mongoose.model('counter', CounterSchema);
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
	_id: {type: Number},
	longUrl: String,
	shortUrl: String,
	description: String,
	active: Boolean,
	timeStamp: Date,
	clicks: Number,
	lastAccess: Date
},
{versionKey: false})

urlSchema.pre('save', function(next){
  var url = this;
  counter.findByIdAndUpdate({_id: 'url_count'}, {$inc: {seq: 1} }, function(error, counter) {
      if (error)
          return next(error);
      // set the _id of the urls collection to the incremented value of the counter
      if (url._id) {
      	next();
      }
      else{
      	url._id = counter.seq;
      }
      
      next();
  });
});
module.exports = mongoose.model('url',urlSchema)