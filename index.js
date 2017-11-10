var config = require('./server/config/config');
var context = require('./server/server');
var mongoose = require('mongoose');

mongoose.connect("mongodb://localhost/data",{useMongoClient:true});

context.server.listen(config.port);
console.log("Listening on http://localhost:"+config.port);


