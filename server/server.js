var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var expressWs = require('express-ws')(app,server);
var api = require('./api');
var Promise = require("bluebird");
var path = require ("path");
var fs = require("fs");
Promise.promisifyAll(fs);

var process = require('./util/processData.js');
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

var filePath = "./public/assets/orig/2015.csv";
/*
var data = fs.readFile(filePath,'utf-8',function(err,data){
    console.log(data);
});
*/

fs.readFileAsync(filePath)
    .then(process.csvToJson)
   .then((file)=>{console.log(file.toString());})
;










//============================================EXPORTS FOR SERVER
exports.app = app;
exports.server = server;
exports.expressWs = expressWs;
module.exports = exports;



