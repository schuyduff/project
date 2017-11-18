var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var expressWs = require('express-ws')(app,server);
var api = require('./api');


require('./middleware/appMiddleware')(app);



app.use('/api', api);

app.use(function(err,req,res,next){
    if (err){
	console.log("------------------------------------------------Error!");
	res.send(err);
    }
});




//============================================EXPORTS FOR SERVER
exports.app = app;
exports.server = server;
exports.expressWs = expressWs;
module.exports = exports;



