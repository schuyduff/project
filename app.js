var http = require('http');
var express = require("express");
var path = require ("path");
var cors = require("cors");
var bodyParser = require("body-parser");
var tools = require("./lib/tools.js");
var fs = require("fs");
var Particle = require('particle-api-js');
var path = require("path");

//======================================================== begin server
var app = express();
module.exports = app;
var server = http.createServer(app).listen(8080);
var io = require('socket.io')(server);


//=========================================================data storage
var _json = [];
var _sensor = [];
var storage = [];
//===================================================include middleware
app.use(express.static("./public"));
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

//====================================================== handle sockets

io.on("connection",function(socket){

    socket.emit("message","Welcome to Cyber Chat");
    socket.on("chat", function(message){

	socket.broadcast.emit("message", message);
   });

});

//============================================== handle incoming csv file
tools.csvToJson("./public/assets/2014.csv",(_path,body)=>{

    _json = body;
    var fileName = path.basename(_path).replace(/\.[^/.]+$/, "");

		if (!fs.existsSync("./public/assets/"+fileName+".json")){
		    fs.writeFile("./public/assets/"+fileName+".json", JSON.stringify(_json),(err)=>{
			console.log(fileName+".json file written");
		    });
		}
	       });
//============================================= custom middle ware to log requests
app.use(function(req, res, next) {
    console.log(`${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
    next();
});
//================================================= incoming post requests from photon 
app.post("/datalogger", function(req, res) {
    _sensor.push(req.body);
    res.json("received");
    tools.storeIncomingSensorData(req.body.data,storage,function(_storage){

	storage = _storage;
	console.log(storage.length);
//	console.log(storage);
    });
});




server.listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});
