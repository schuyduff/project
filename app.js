var express = require("express");
var http = require('http');
var path = require ("path");
var cors = require("cors");
var bodyParser = require("body-parser");
var tools = require("./lib/tools.js");
var fs = require("fs");
var Particle = require('particle-api-js');
var path = require("path");
var formatting = require("./lib/formatting.js");
var compute = require("./server/util/compute.js");
var mkdirp = require("mkdirp");
var WebSocket = require('ws');
var url = require('url');
var _ = require('lodash');
//=========================================================data storage
var _json = [];
var _sensor = [];
var year = 2008;
var buffer = [];

//making a change======================================================== begin server

var app = express();

module.exports = app;


//===================================================include middleware
app.use(express.static("./public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(function(req, res, next) {
    console.log(`${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
    next();
});

//=============================================================== get request from photon

app.get("/assets/:day",function(req,res,next){
    
    console.log(parseInt(req.params.day));
    
    var formatted = JSON.parse(fs.readFileSync("./public/assets/"+year+"_PPFD_half_hourly.json", 'utf8'));

//    console.log(formatted.length);
    
   // console.log(formatted);
    var transmit = formatted.filter(function(item){
	
	return (item.Day365 == parseInt(req.params.day));
	
    });

    console.log(transmit[0]);

	compute.PPFD_Day365_only_hourly(transmit, function(_data){
//	    console.log(_data);
//	    console.log("Transmitted length: "+_data.length);
	    res.json(_data);
	    next();
	    
	});

    
});

//====================================================================get request from client

app.get("/assets/datalogger/:lookback",function(req,res,next){

    var input = parseInt(req.params.lookback);
    
//    console.log(input);

    var _year = 2017;
    
    var formatted = JSON.parse(fs.readFileSync("./public/assets/datalogger/"+_year+".json", 'utf8'));
/*
    var transmit = formatted.filter(function(item){

	return item.T >= input;
    });
*/
    var transmit = formatted.slice(-input);
//    console.log(transmit[0]);
//    console.log("StreamGraph GET Length: "+transmit.length);
    buffer = [];
    res.json(transmit);
    next();
    
});


//================================================= incoming post requests from photon

app.post("/datalogger", function(req, res, next) {

//    console.log(req.body);
//    tools.datalogger(req.body);
//    buffer = buffer.concat(req.body);
//    console.log("Buffer length: "+ buffer.length);
//    console.log(buffer);
});


tools.csvToJson("./public/assets/orig/"+year+".csv",(_path,body)=>{
    
    _json = body;

    var fileName = path.basename(_path).replace(/\.[^/.]+$/, "");

		//CHANGE WRITEFLAG TO NAUGHT
		if (fs.existsSync("./public/assets/"+fileName+".json")){



		    formatting.parseJSON(_json, function(_data){
			//console.log(_data);
	
		
			
			compute.GHI_to_PPFD_wrapper(_data, function(_data){
			//    console.log(_data);
			    
			    console.log(_.take(_data,10));			    
			    
		//	    console.log(_data);
			    compute.LinearHours(_data, function(_data){


//				console.log(_data[_data.length-1]);

				fs.writeFile("./public/assets/"+fileName+"_PPFD_half_hourly.json", JSON.stringify(_data),(err)=>{
				console.log(fileName+"_PPFD_half_hourly.json file written");

				    //console.log(_data);
				});

			    });
			//    console.log(_data);
			    compute.DLI(_data,function(_data){


				//				console.log(_data);
/*
				var max = Math.max.apply(null,_data.map(function(o){return o.DLI;}));
				var min = Math.min.apply(null,_data.map(function(o){return o.DLI;}));
				var longestday = _data.find(function(o){ return o.DLI == max; });
				var shortestday= _data.find(function(o){ return o.DLI == min; });
				console.log(longestday);
				console.log(shortestday);
*/
				fs.writeFile("./public/assets/"+fileName+".json", JSON.stringify(_data),(err)=>{
				console.log(fileName+".json file written!");

				});

			    });

			});
		    });
		    		 
		} else if (fs.existsSync("./public/assets/datalogger/"+year+".json","utf8")){

		   var old = JSON.parse(fs.readFileSync("./public/assets/"+year+".json","utf8"));

		   var log = JSON.parse(fs.readFileSync("./public/assets/datalogger/"+year+".json","utf8"));

		    
		    console.log(log.length);

//		    console.log(log[0]);

		    tools.findMissingDays(log);

		    compute.process_DLI_2(log,old,function(_old){

//			console.log(_old);
			
			fs.writeFile("./public/assets/"+fileName+".json", JSON.stringify(_old),(err)=>{
			    
			    console.log(fileName+".json update file written!");
			});
			
			
		    });

		    compute.rule_accumulator(log, function(rules){
			console.log(rules);
			fs.writeFile("./public/assets/"+fileName+"_rules.json", JSON.stringify(rules),(err)=>{
			    
			    console.log(fileName+".json rule file written!");
			});
			
			
		    });



		}

		
	       });




/*
console.log("Starting a Socket App - http://localhost:8080");


io.on("connect",function(socket){
    
    
    
    socket.on("Client disconnect",function(){

	clearInterval(interval);
	console.log("disconnected");
    });

    
    console.log("Client Connected");
    console.log("Socket ID: "+socket.id);
    console.log(socket.handshake);
    //    console.log(DEBUG);

    var interval = setInterval(function(){

//	socket.emit("message", "helloWorld");


	if (buffer.length > 0){

	    socket.emit("update",buffer.shift());
	    console.log("buffer length: "+buffer.length);

	        
	}


	
    },1050);

});
*/




//========================================================================server setup

var server = http.createServer(app);

server.listen(process.env.PORT || 8080, function(){
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});
//var io = require("socket.io").listen(server);
//====================================================================websockets

var wss = new WebSocket.Server({server});
console.log("Websocket Server Created");

var clients = [];

wss.broadcast = function(data){

    console.log("Broadcast: "+ data);

    clients.forEach(function(client){
	if (client.readyState === WebSocket.OPEN) {

	    client.send(data);
	}

    });
};



wss.on("connection",function(ws, req){

    console.log("Websocket Connection Open " );
    
    const location = url.parse(req.url,true).path;

    console.log(location);

    if (location == '/photon'){

	var start;

	var previous;

	if (fs.existsSync("./public/assets/datalogger/"+2017+".json")){
	    
	    previous = JSON.parse(fs.readFileSync("./public/assets/datalogger/"+2017+".json"));
	    start = new Date(previous[previous.length-1].T*1000);
	    
	}else{

	    start = new Date(2017,0,1);

	} 
	
	var T = start.getTime()/1000;
	var L = 196.7593;
	var R = 1.0;
	var E = 1000.000;
	var D = 1.0;

	var object = {};

	object.T = T;
	object.L = L;
	object.R = R;
	object.E = E;
	object.D = D;


	var payload = [];

	payload.push(object);

	var message = JSON.stringify(payload);
	
	ws.send(message,function(){
	    console.log("Sent: %s", message);
	});

	/*
	var id = setInterval(function() {
	    
	    var message = tools.payload(object);
	    
	    ws.send(message,function(){
		console.log("Sent: %s", message);
	    });
	    
	    
	}, 100);
*/
    } else {
	
	clients.push(ws);
	console.log("clients length: %s",clients.length);
    }

 
    ws.on('message', function(message,err) {
//	console.log('Received: %s', message);
	
	var payload = JSON.parse(message);
	
	tools.datalogger(payload);
	wss.broadcast(message);


	payload = tools.payload(payload[0]);
	ws.send(payload,function(){
	    console.log("Sent: %s", payload);
	});

    });
 

    ws.on("close", function() {
	console.log("websocket connection close");

	try {

	    clearInterval(id);

	}catch(e){
	    //console.log("catch error");
	}
	
	clients.splice(clients.indexOf(ws),1);
    });

    ws.on("error",function(){
	console.log("handle error");
	ws.terminate();
    });
    
});






