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
    
    return process.targetNotExists(filePath)
	.then(process.readFile)	
	.then(process.csvToJson)
	.then(process.format)
	.then(process.computeDLI)
	.then(process.logStats)
	.then((file)=>{

	    return process.writeFile(file, file.fileName);   
	})
    
	.then((file)=>{
//	    console.log(file.contents);

	    console.log("Processed: %s",file.fileName);
	    return null;
	    
	})
	.catch((e)=>{
//	    console.log("Error: %s",e.message);
//	    console.log(e);
	});
  
},{concurrency:3}).then(()=>{
    console.log("Done processing files!\n");
    return null;
}).catch((e)=>{
//    console.log("Error: %s",e.message);
    
});

//==========================================================DATA VALIDATION



var processed = './public/assets/processed/2015.json';

process.getFiles(processed).each(function(filePath){
    
    return logger.targetExists(filePath)
	.then(process.readFile)
	.then(logger.convertJSON)
	.then(logger.missing)
	.then(process.computeDLI)
    	.then(process.logStats)

	.then((file)=>{
	    console.log(file.fileName);
	    return process.writeFile(file, file.fileName);   
	})

	.then(process.ruleSum)

	.then((file)=>{
	    return process.writeFile(file, file.fileName);   
	})

	.then((file)=>{
	    console.log("Checked: %s",file.fileName);
	    return null;
	})
	.catch((e)=>{
	    console.log("---------------------------------Error checking files: %s",e.message);
	    console.log(e);
	});


},{concurrency:1}).then(()=>{
    console.log("Done checking files!\n");
    return null;
}).catch((e)=>{
    //    console.log(e);
    console.log("Error checking: %s",e.message);
    console.log(e);
});



