
var context = require('./server/server');
var mongoose = require('mongoose');
var fs = require('fs');
var v8 = require('v8');

process.env.NODE_ENV = 'staging';

var config = require('./server/config/config');

//console.log(config.db.url);

mongoose.connect(config.db.url, {useMongoClient:true});

context.server.listen(config.port);
console.log("Listening on http://localhost:"+config.port);

//console.log(process.memoryUsage());

