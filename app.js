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
//making a change======================================================== begin server
var app = express();
module.exports = app;
var server = http.createServer(app).listen(process.env.PORT ||8080);
var io = require('socket.io')(server);


//=========================================================data storage
var _json = [];
var _sensor = [];

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
tools.csvToJson("./public/assets/2015.csv",(_path,body)=>{

    _json = body;
    //console.log(_json);
    var fileName = path.basename(_path).replace(/\.[^/.]+$/, "");

		//CHANGE WRITEFLAG TO NAUGHT
		if (fs.existsSync("./public/assets/"+fileName+".json")){

		    fs.writeFile("./public/assets/"+fileName+"_raw.json", JSON.stringify(_json),(err)=>{
		   // 	console.log(fileName+"_raw.json file written");
		//	console.log(_json);
		    });
		    
		    formatting.parseJSON(_json, function(_data){
			//console.log(_data);		
			compute.GHI_to_PPFD_wrapper(_data, function(_data){
			    
			    console.log(_data); 
			   // this needs to go to photon broken into chunks
			    compute.PPFD_Day365_only_hourly(_data, function(_data){
			//	console.log(_data);
/*
				var temp=[];
				var chunk = 24;
				for (i=0;i<_data.length;i+=chunk){
				    temp=_data.slice(i,i+chunk);
				    fs.writeFileSync("./public/assets/"+_json[chunk].Year+"_"+_json[chunk].Month+"_"+_json[chunk].Day+"_"+_json[chunk].Minute+".json", JSON.stringify(temp));





				    console.log("./public/assets/"+_json[chunk].Year+"_"+_json[chunk].Month+"_"+_json[chunk].Day+"_"+_json[chunk].Minute+".json");

				}

*/
				fs.writeFile("./public/assets/"+fileName+"_PPFD_Day365_hourly.json", JSON.stringify(_data),(err)=>{
				    console.log(fileName+"_PPFD_Day365_hourly.json file written");
				   // console.log(_json);
				});
			    });

			    compute.LinearHours(_data, function(_data){

				fs.writeFile("./public/assets/"+fileName+"_PPFD_half_hourly.json", JSON.stringify(_data),(err)=>{
				    console.log(fileName+"_PPFD_half_hourly.json file written");
				    //console.log(_data);
				});

			    });

			    compute.DLI(_data,function(_data){

				fs.writeFile("./public/assets/"+fileName+".json", JSON.stringify(_data),(err)=>{
				    console.log(fileName+".json file written");
			
		    });

			    });

			});
		    });
		}
	//	console.log(_json);
	       });
//============================================= custom middle ware to log requests
app.use(function(req, res, next) {
    console.log(`${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
    next();
});
//================================================= incoming post requests from photon 

var count = 5;

app.post("/datalogger", function(req, res) {
    //_sensor.push(req.body);
    //res.json("received");
    tools.storeIncomingSensorData(req.body.data,res,function(_data,res){
//	console.log(_data);
	var values = [];
	for (i=0;i<180;i++){
	    
	    values.push(JSON.parse(_json[count]).GHI);
	    count+=2;
	}
	res.json(values);
	
    });
  
});




server.listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});
