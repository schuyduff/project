var http = require('http');
var express = require("express");
var path = require ("path");
var cors = require("cors");
var bodyParser = require("body-parser");
var tools = require("./lib/tools.js");
var fs = require("fs");
var Particle = require('particle-api-js');
var path = require("path");
var formatting = require("./lib/formatting.js");
var compute = require("./lib/compute.js");
var mkdirp = require("mkdirp");

//making a change======================================================== begin server

var app = express();

module.exports = app;

var server = http.createServer(app);
var io = require("socket.io").listen(server);


server.listen(process.env.PORT || 8080, function(){
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});


//===================================================include middleware

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
    console.log(`${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
    next();
});

app.use(express.static("./public"));

app.use(cors());



//=========================================================data storage
var _json = [];
var _sensor = [];
var year = 2014;
var buffer = [];

//=============================================================== get request from photon

app.get("/assets/:day",function(req,res,next){
    
//    console.log(parseInt(req.params.day));
    
    var formatted = JSON.parse(fs.readFileSync("./public/assets/"+year+"_PPFD_half_hourly.json", 'utf8'));

//    console.log(formatted.length);
    
   // console.log(formatted);
    var transmit = formatted.filter(function(item){
	
	return (item.Day365 == parseInt(req.params.day));
	
    });

   // console.log(transmit);

	compute.PPFD_Day365_only_hourly(transmit, function(_data){
//	    console.log(_data);
//	    console.log("Transmitted length: "+_data.length);
	    res.json(_data);
	    next();
	    
	});

    
});

//====================================================================get request from client

app.get("/assets/datalogger/:lookback",function(req,res,next){

    //console.log(parseInt(req.params.lookback));
    var input = parseInt(req.params.lookback);

    var date = new Date(input*1000);

    var _year = date.getFullYear();
    
    var formatted = JSON.parse(fs.readFileSync("./public/assets/datalogger/"+_year+".json", 'utf8'));

    var transmit = formatted.filter(function(item){

	return item.T >= input;
    });

//    console.log(transmit[0]);
    console.log("Transmit Length: "+transmit.length);

    res.json(transmit);
    next();
    
});


//================================================= incoming post requests from photon

app.post("/datalogger", function(req, res, next) {

//    console.log(req.body);
//    tools.datalogger(req.body);
    buffer = buffer.concat(req.body);
    console.log("Buffer length: "+ buffer.length);
//    console.log(buffer);
});


tools.csvToJson("./public/assets/"+year+".csv",(_path,body)=>{
    
    _json = body;
    //console.log(_json);
    var fileName = path.basename(_path).replace(/\.[^/.]+$/, "");

		//CHANGE WRITEFLAG TO NAUGHT
		if (!fs.existsSync("./public/assets/"+fileName+".json")){

//		    console.log(_json);

		    formatting.parseJSON(_json, function(_data){
			//console.log(_data);
			compute.GHI_to_PPFD_wrapper(_data, function(_data){
			//    console.log(_data);
			    

		//	    console.log(_data);
			    compute.LinearHours(_data, function(_data){

//				console.log(_data.length);

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
		    		 
		} else if (!fs.existsSync("./public/assets/"+fileName+"_rules.json")){

		   var old = JSON.parse(fs.readFileSync("./public/assets/"+year+".json","utf8"));

		   var log = JSON.parse(fs.readFileSync("./public/assets/datalogger/"+year+".json","utf8"));

		   
//		    console.log(log.length);
//		    console.log(log.slice(-50));

		    tools.findMissingDays(log);
/*
		    compute.process_DLI(log,old,function(_old){
//			console.log(_old);
			fs.writeFile("./public/assets/"+fileName+".json", JSON.stringify(_old),(err)=>{
			    console.log(fileName+".json update file written!");
			});
		    });
*/

		    compute.process_DLI_2(log,old,function(_old){

//			console.log(_old);
			
			fs.writeFile("./public/assets/"+fileName+".json", JSON.stringify(_old),(err)=>{
			    
			    console.log(fileName+".json update file written!");
			});
			
			
		    });

		    compute.rule_accumulator(log, function(rules){
//			console.log(rules);
			fs.writeFile("./public/assets/"+fileName+"_rules.json", JSON.stringify(rules),(err)=>{
			    
			    console.log(fileName+".json rule file written!");
			});
			
			
		    });



		}

		
	       });





//==================================server cont'd




/*
server.listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});
*/

//================================================================websockets


/*
io.on("message",function(socket){


    socket.on("chat",function(message){
	socket.broadcast.emit("message", message);
    });

    
    socket.emit("message", "Welcome to cyber chat");
    
});
*/

console.log("Starting a Socket App - http://localhost:8080");


io.on("connect",function(socket){

    socket.on("disconnect",function(){

	clearInterval(interval);
	console.log("disconnected");
    });

    console.log("Client Connected");

    var interval = setInterval(function(){

	if (buffer.length > 0){

	    socket.emit("update",buffer.shift());
	    console.log("buffer length: "+buffer.length);
	}


	
    },1050);

});










