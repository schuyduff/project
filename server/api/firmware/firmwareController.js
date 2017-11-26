
var fs = require('fs');
var tools = require('../../util/tools');
var compute = require("../../util/compute.js");
var model = require('./firmwareModel');
var context = require('../../server');
var _ = require('lodash');
var firmwareControllerWs = require('./firmwareControllerWs');
var process = require('../../util/processData.js');
var logger = require('../../util/logger.js');

exports.param_day = function(req,res,next,day){
    // console.log("Lookback %s",lookback);
    req.day = day;
    next();
};

exports.param_year = function(req,res,next,year){
    // console.log("Lookback %s",lookback);
    req.year = year;
    next();
};

exports.day = function(req,res,next){

    
    var processed = "./public/assets/processed/"+req.year+".json";

    process.getFiles(processed).map(function(filePath){

//	console.log(filePath);
	return logger.targetExists(filePath)
	    .then(process.readFile)
	    .then((file)=>{
		return process.getChunk(file,req.day);
	    })
	    .then((file)=>{
//		console.log(file.chunk);
		res.json(file.chunk);
		console.log("Request for day %s, %s!",req.day, req.year);
		return null;
	    })
	    .catch((e)=>{
		console.log("Error: %s",e.message);
		console.log(e);
		next(e);
		
	    });

	
    },{concurrency:3}).then(()=>{
	console.log("Done sending files!\n");
	return null;
    }).catch((e)=>{
	console.log("Error: %s",e.message);
	console.log(e);
	next(e);

    });

};

exports.datalogger = function(req,res,next){
//    console.log(req.body);   
//    tools.datalogger(req.body);

    var processed = "./public/assets/processed/"+req.year+".json";
   
    process.getFiles(processed).map(function(filePath){

	return logger.targetExists(filePath)
	    .then(process.readFile)
	    .then((file)=>{
		return process.datalogger(file,req.body);
	    })
	    .then((file)=>{
		
		return process.writeFile(file,file.fileName);
	    })
	    .then((file)=>{
		console.log("\nLogged to: %s",file.fileName+".json!");
//		console.log(file.contents);
		return null;

	    })
	    .catch((e)=>{
		console.log("Error: %s",e.message);
		console.log(e);
		next(e);
	    });

    },{concurrency:3}).then(()=>{
	console.log("Done logging files!\n");
	return null;
    }).catch((e)=>{
	console.log("Error: %s",e.message);
	console.log(e);
	next(e);

    });
    
    res.send("Logged.");
    
   
    
};

exports.ws = function(ws,req){

    console.log("Websocket Connection with Firmware!" );
    
    ws.on('message',(msg)=>{firmwareControllerWs.message(msg,ws,req);});

    ws.on("close", function(){
	console.log("Websocket Disconnected from Client!");
	
    });
    
    ws.on("error",function(){
	console.log("Error! Connection Terminated!");
	ws.terminate();
    });
    
	  
};
