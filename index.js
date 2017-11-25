var config = require('./server/config/config');
var context = require('./server/server');
var mongoose = require('mongoose');
var fs = require('fs');
var v8 = require('v8');
//mongoose.connect("mongodb://localhost/data",{useMongoClient:true});
//console.log(process.env);
mongoose.connect(config.db.url, {useMongoClient:true});

console.log(config.db.url);

context.server.listen(config.port);
console.log("Listening on http://localhost:"+config.port);

//console.log(process.memoryUsage());

