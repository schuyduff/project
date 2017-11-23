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
var logger = require('./util/logger.js');




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

var orig = './public/assets/orig/*.csv';

process.getFiles(orig).map(function(filePath){

    return process.targetExists(filePath)
	.then(process.readFile)
	.then(process.csvToJson)
	.then(process.format)
	.then(process.computeDLI)
	.then(process.logStats)
	.then(process.writeFile)    
	.then((file)=>{
//	    console.log(file.contents);

//	    console.log("Processed: %s",file.fileName);
	    return null;
	    
	})
	.catch((e)=>{
//	    console.log("Error: %s",e.message);

	});
  
},{concurrency:3}).then(()=>{
    console.log("Done processing files!");
    return null;
}).catch((e)=>{
    console.log("Error: %s",e.message);
    
});




var processed = './public/assets/processed/*.json';

process.getFiles(processed).each(function(filePath){
    
    return logger.targetExists(filePath)
	.then(process.readFile)
	.then(logger.missing)
	.then((file)=>{
	    console.log("Checked: %s",file.fileName);
	    
	})
	.catch((e)=>{
	    console.log("Error: %s",e.message);

	});


}).then(()=>{
    console.log("Done checking files!");
}).catch((e)=>{
    //    console.log(e);
    console.log("Error: %s",e.message);
});



