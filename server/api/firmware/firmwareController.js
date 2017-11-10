
var fs = require('fs');
var tools = require('../../util/tools');
var compute = require("../../util/compute.js");
var firmware = require('./firmwareModel');
var context = require('../../server');
//var mongoose = require('mongoose');
var _ = require('lodash');


exports.ws = function(ws,req){

    console.log("Websocket Connection with Firmware!" );
    
    console.log(context.expressWs.getWss('/socketClient').clients);
//====================================================================on message
    ws.on("message",function(msg){

//	console.log("Received: %s",msg);

//=======================================================================GET LAST
	if (msg == 'init'){

	    firmware.getLast(function(err,max){
		
		if(err)console.log(err);
		
		var object = {};
		
		if (max){
		    
		    //console.log(max);
		    
		    object.T = max.T;
		    object.L = max.L;
		    object.LL = max.LL;
		    object.R = max.R;
		    object.E = max.E;
		    object.D = max.D;
		    object.DLI = max.DLI;
		    
		    //console.log(object);
		    
		} else {
		    
		    var T = (new Date(2017,0,0,23,59,59)).getTime()/1000;
		    var L = 196.7593;
		    var LL = 0.0;
		    var R = 0.0;
		    var E = 0.000;
		    var D = 0.0;
		    var DLI = 0.0;
		    
		    
		    
		    object.T = T;
		    object.L = L;
		    object.LL = LL;
		    object.R = R;
		    object.E = E;
		    object.D = D;
		    object.DLI = DLI;
		    
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
	    object.DLI = object.DLI/100000;	    
	    object.L = object.L/10000;
	    tools.edit(object);

	    object = _.omit(object,['_id','__v']);

	    //console.log(object);
	    firmware.findOne({T:object.T}).exec(function(err,elem){
		
		if(err)console.log(err);
		
		if (!elem){
		    
		    firmware.create(object,function(err,doc){
			
			if(err)console.log(err);

		    });	
		    
		}
		
	    
		var payload = [];
		
		payload.push(object);
		
		var message = JSON.stringify(payload);
		
		ws.send(message, function(){
		    console.log("Sent:     %s", message);
		    
		});
	    


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
