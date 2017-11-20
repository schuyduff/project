
var fs = require('fs');
var tools = require('../../util/tools');
var compute = require("../../util/compute.js");
var model = require('./firmwareModel');
var context = require('../../server');
var _ = require('lodash');


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

    //    console.log(parseInt(req.params.day));
    var year = req.year;

    var formatted = JSON.parse(fs.readFileSync("./public/assets/"+year+"_PPFD_half_hourly.json", 'utf8'));

    //    console.log(formatted.length);
    // console.log(formatted);
    var transmit = formatted.filter(function(item){

	return (item.Day365 == parseInt(req.params.day));

    });

    //  console.log(transmit[0]);
    compute.PPFD_Day365_only_hourly(transmit, function(_data){
	//          console.log(_data);                                                                                                                                                                                  //          console.log("Transmitted length: "+_data.length);
	res.json(_data);
//	next();

    });
    
};

exports.datalogger = function(req,res,next){
    
    tools.datalogger(req.body);
    
    res.send("received");

    
};

exports.ws = function(ws,req){

    console.log("Websocket Connection with Firmware!" );
    

//====================================================================on message
    ws.on("message",function(msg){

//	console.log("Received: %s",msg);

//=======================================================================GET LAST
	if (msg == 'init'){

	    model.getLast(function(err,max){

//		console.log("ran");
		
		
		if(err)console.log(err);
		
		var object = {};
		
		if (max){
		    
//		    console.log(max);
		    
		    object.T = max.T;
		    object.L = max.L;
		    object.LL = max.LL;
		    object.R = max.R;
		    object.E = max.E;
		    object.D = max.D;
		    object.DLI = max.DLI;
		    
//		    console.log(object);
		    
		} else {

//		    console.log("!max");
		    
		    //		    object.T = (new Date(2017,0,1,7,23)).getTime()/1000;
		    object.T = (new Date(2017,0,0,23,59,59)).getTime()/1000;
		    object.L = 0.0;
		    object.LL = 0.0;
		    object.R = 0.0;
		    object.E = 0.0;
		    object.D = 0.0;
		    object.DLI = 0.0;

//		    console.log(object);

		}
		
		var payload = [];
		
		payload.push(object);
		
		var message = JSON.stringify(payload);

		ws.send(message,function(){
		    console.log("Sent:     %s", message);
		});
		
	    });

//========================================================================check if exists, else write to database
	} else {
	    
	    var object = JSON.parse(msg)[0];
	    //	console.log(object);
	    object.DLI = object.DLI/10000000.0;	    
	    object.L = object.L/10000;
	    tools.edit(object);

	    object = _.omit(object,['_id','__v']);

	    //console.log(object);
	    model.findOne({T:object.T}).exec(function(err,elem){
		
		if(err)console.log(err);
		
		if (!elem){
		    
		    model.create(object,function(err,doc){
			
			if(err)console.log(err);

		    });	
		    
		}
		
		object = _.omit(object,['_id','__v','Year','Month','Day','Hour','Minute','Second','Day365','Hour24']);
		
		var payload = [];
		
		payload.push(object);
		
		var message = JSON.stringify(payload);
		
		ws.send(message, function(){
		    console.log("Sent:     %s", message);
		    
		});
/*	    
		context.expressWs.getWss('/api/client/socket').clients.forEach(function(client){

		    if (client.upgradeReq.baseUrl == '/api/client'){
//			console.log(client.upgradeReq.baseUrl);
			client.send(message);
		    }
		    
		    
		});
*/


	    });
	    
	    
	}
	
	
    });
    
    ws.on("close", function(){
	console.log("Websocket Disconnected from Client!");
	
    });
    
    ws.on("error",function(){
	console.log("Error! Connection Terminated!");
	ws.terminate();
    });
    
	  
};
