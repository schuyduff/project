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

//==========================================================DATA PROCESSING

var wildCard = './public/assets/orig/*1.csv';

process.getFiles(wildCard).map(function(filePath){

    fs.readFileAsync(filePath)
	.then(process.csvToJson)
	.then(process.format)
	.then(process.computeDLI)
        .then(process.logStats)
	.then(process.writeFile)
	.then(()=>{
	    console.log("Done!");
	    return;
	})
	.catch((e)=>{
	    console.log(e);
	    return;
	});


    
});


var json = fs.readFileSync('./public/assets/processed/2001.json','utf-8');
console.log(JSON.parse(json));

/*
var readAll = fs.readFileAsync(filePath)
    .then(process.csvToJson)
    .then(process.format)
    .then(process.computeDLI)
    .then(process.logStats)
    .then(process.writeFile)
    .then(()=>{
	console.log("Done!");
    })
    .catch((e)=>{
	console.log(e);
    });
*/











//============================================EXPORTS FOR SERVER
exports.app = app;
exports.server = server;
exports.expressWs = expressWs;
module.exports = exports;



