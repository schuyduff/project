var config = require('./server/config/config');
var context = require('./server/server');
var mongoose = require('mongoose');
var fs = require('fs');
//mongoose.connect("mongodb://localhost/data",{useMongoClient:true});
//console.log(process.env);
mongoose.connect(config.db.url, {useMongoClient:true});

console.log(config.db.url);

context.server.listen(config.port);
console.log("Listening on http://localhost:"+config.port);


//var log = JSON.parse(fs.readFileSync("./public/assets/datalogger/"+year+".json","utf8"));
//tools.findMissingDays(log);

