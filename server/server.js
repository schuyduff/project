var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var expressWs = require('express-ws')(app,server);
var api = require('./api');
var Promise = require("bluebird");
var fs = require("fs");
Promise.promisifyAll(fs);
var _ = require('lodash');
var process = require('./util/processData.js');
var glob = require("glob");



//========================================================SERVER ROUTING
require('./middleware/appMiddleware')(app);

app.use('/api', api);

app.use(function(err,req,res,next){
    if (err){
	console.log("------------------------------------------------Error!");
	console.log(err);
	res.send();
    }
});



//============================================EXPORTS FOR SERVER
exports.app = app;
exports.server = server;
exports.expressWs = expressWs;
module.exports = exports;


//==========================================================DATA PROCESSING

var wildCard = './public/assets/orig/*.csv';

process.getFiles(wildCard).each(function(filePath){

    return process.fileExists(filePath)
	.then(process.readFile)
	.then(process.csvToJson)
	.then(process.format)
	.then(process.computeDLI)
        .then(process.logStats)
	.then(process.writeFile)    
	.then((file)=>{
//	    console.log(file.contents);
	    console.log("Processed: %s",file.fileName);

	    
	})
	.catch((e)=>{
//	    console.log(e);

	});
  
  
}).then(()=>{
    console.log("Done processing files!");
}).catch((e)=>{
    console.log(e);
});





