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

//var io = require('socket.io')(server);


//=========================================================data storage
var _json = [];
var _sensor = [];
var year = 2015;



//===================================================include middleware

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
    console.log(`${req.method} request for '${req.url}' - ${JSON.stringify(req.body)}`);
    next();
});

app.use(express.static("./public"));

app.use(cors());


//=============================================================== get request from photon

app.get("/assets/:day",function(req,res,next){
    
    console.log(parseInt(req.params.day));
    
    formatted = JSON.parse(fs.readFileSync("./public/assets/"+year+"_PPFD_half_hourly.json", 'utf8'));

//    console.log(formatted.length);
    
   // console.log(formatted);
    transmit = formatted.filter(function(item){
	
	return (item.Day365 == parseInt(req.params.day));
	
    });

//    console.log(transmit);

	compute.PPFD_Day365_only_hourly(transmit, function(_data){
//	    console.log(_data);
//	    console.log("Transmitted length: "+_data.length);
	    res.json(_data);
	    next();
	    
	});

    
});


//================================================= incoming post requests from photon

app.post("/datalogger", function(req, res, next) {

//    console.log(req.body);
    tools.datalogger(req.body);

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
		    		 
		} else if (fs.existsSync("./public/assets/datalogger/"+year+".json")){

		   var old = JSON.parse(fs.readFileSync("./public/assets/"+year+".json","utf8"));

		   var log = JSON.parse(fs.readFileSync("./public/assets/datalogger/"+year+".json","utf8"));

		   
//		    console.log(log.length);
//		    console.log(log);

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






var server = http.createServer(app).listen(process.env.PORT || 8080);

server.listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});
