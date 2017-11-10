var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var expressWs = require('express-ws')(app,server);
var api = require('./api');


require('./middleware/appMiddleware')(app);



/*
setInterval(function(){
var aWss = expressWs.getWss('/api/client/socket');
console.log(aWss.clients);

},1000);
*/

app.use('/api', api);

app.use(function(err,req,res,next){
    if (err){
	res.status(500).send(err);
    }
});




//============================================EXPORTS FOR SERVER
exports.app = app;
exports.server = server;
exports.expressWs = expressWs;
module.exports = exports;



