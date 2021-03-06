
var fs = require('fs');
var tools = require('../../util/tools');
var compute = require("../../util/compute.js");
var model = require('./firmwareModel');
var context = require('../../server');
var _ = require('lodash');
var process = require('../../util/processData.js');

exports.message = function(msg,ws,req){

//    console.log("Received: %s",msg);

    if (msg == 'init'){
	
	model.getLast()
	    .then(self.initialize)

	    .then((message)=>{
		return self.send(message,ws);
	    })

	    .then((result)=>{
		console.log("Websocket initialized to document: %s", result);
		return null;
	    })
	    .catch((e)=>{
		console.log("Error on websocket init: %s",e.message);
		console.log(e);
	    });
	
    } else {


	self.receiver(msg)
	    .then(self.exists)
	    .then(self.create)
/*
	    .then((message)=>{
		return self.send(message,ws);
	    })
*/
	    .then(self.broadcast)
	    .then((result)=>{
		console.log(result);

		return null;
	    })
	    .catch((e)=>{
		console.log("Error on websocket receiver: %s",e.message);
		console.log(e);
	    });
    } 

};

var self = {
    
    initialize(document){
	
	return new Promise(function(resolve,reject){

	    try{

		var object = {};
		var wrapper = [];
		var message = "";

		if (document){
		    		    
		    document = _.omit(document, ["_id","__v"]);
		    wrapper.push(document);
		    message = JSON.stringify(wrapper);
		    return resolve(message);

		} else {

		    object.T = (new Date(2017,0,0,23,59,59)).getTime()/1000;
		    object.L = 0.0;
		    object.LL = 0.0;
		    object.R = 0.0;
		    object.E = 0.0;
		    object.D = 0.0;
		    object.DLI = 0.0;
		    
		    wrapper.push(object);
		    message = JSON.stringify(wrapper);
		    return resolve(message);
		}
		
	    } catch(e){
	
		return reject(e);
	    }
	});
    },

    send(message,ws){

	return new Promise(function(resolve,reject){
	    
	    try{

		return ws.send(message,function(err){

		    if (err){

			console.log("-----------------------------Error at websocket initialization send!");
			return reject(err);

		    } else {
	
			return resolve(message);
		    } 
		    
		});


		
	    } catch(e){
		return reject(e);
	    }
	});
    },

    receiver(msg){

	return new Promise(function(resolve,reject){

	    try{

		var object = JSON.parse(msg)[0];
		object.DLI = object.DLI/10000000.0;
		object.L = object.L/10000;
		
		object.T -= (3600000*5/1000);
		tools.edit(object);
		
		object = process.getSunrise(object);
		object.Sunrise = new Date(Date.parse(object.Sunrise)).getTime()/1000;
		object.Sunset = new Date(Date.parse(object.Sunset)).getTime()/1000;
		return resolve(object);

	    } catch(e){
	
		return reject(e);

	    }
	});

    },

    exists(object){

	return model.findOne({T:object.T}).lean().exec().then(function resolve(result){
	    
	    return {
		document:object,
		exists: result
	    };
	    
	},function reject(e){
	    
	    return e;
	});
    },

    create(object){

	return new Promise(function(resolve,reject){

	    try{

		var wrapper = [];
		var message = "";


		if (!object.exists){
		    
		    if (!object.document) console.log(object.document);
		    return model.create(object.document,function(err,doc){

			if(err){

			    return reject(err);

			} else {

			    console.log("websocket create!");
			  
			    doc = doc.toObject();
			    
			    wrapper.push(doc);
			    message = JSON.stringify(wrapper);
			    
			    return resolve(message);
			    
			}
		    });
		    
		} else {

		    console.log("object exists!");

		    //doc = doc.toObject();
//		    console.log(object.document);
		    wrapper.push(object.document);
		    message = JSON.stringify(wrapper);
		    return resolve(message);
		    
		}
		
	    } catch(e){
		return reject(e);
	    }
	});
	
    },

    broadcast(message){
	return new Promise(function(resolve,reject){

	    try{

		context.expressWs.getWss('/api/client/socket').clients.forEach(function(client){
		    
		    if (client.upgradeReq.baseUrl == '/api/client'){
			
			client.send(message);
		    }
		    
		});
		return resolve(message);
	    } catch(e){
		return reject(e);
	    }
	});
    }
/*
    ,
    
    catch_and_log(ws,msg){
//================================================================process
	var object = JSON.parse(msg)[0];
	//  console.log(object);
	object.DLI = object.DLI/10000000.0;
	object.L = object.L/10000;
	tools.edit(object);

	object = _.omit(object,['_id','__v']);
///====================================================================check exists
	//console.log(object);
	model.findOne({T:object.T}).exec(function(err,elem){

	    if(err)console.log(err);

	    if (!elem){
//=========================================================================if ! exists then create
		model.create(object,function(err,doc){

		    if(err)console.log(err);

		});

	    }

	    object = _.omit(object,['_id','__v','Year','Month','Day','Hour','Minute','Second','Day365','Hour24']);

	    var payload = [];

	    payload.push(object);

	    var message = JSON.stringify(payload);
//============================================================================================sendback
	    ws.send(message, function(){
		console.log("Sent:     %s", message);

	    });
//============================================================================================broadcast to client 

	    context.expressWs.getWss('/api/client/socket').clients.forEach(function(client){

		if (client.upgradeReq.baseUrl == '/api/client'){
		    //                      console.log(client.upgradeReq.baseUrl);
		    client.send(message);
		}


	    });



	});

	
    }
*/

    
    
    /*
    init(ws,msg){
	
        model.getLast(function(err,max){

	    //              console.log("ran");


	    if(err)console.log(err);

	    var object = {};

	    if (max){

		//                  console.log(max);

		object.T = max.T;
		object.L = max.L;
		object.LL = max.LL;
		object.R = max.R;
		object.E = max.E;
		object.D = max.D;
		object.DLI = max.DLI;

		//                  console.log(object);

	    } else {

		//                  console.log("!max");

		//              object.T = (new Date(2017,0,1,7,23)).getTime()/1000;
		object.T = (new Date(2017,0,0,23,59,59)).getTime()/1000;
		object.L = 0.0;
		object.LL = 0.0;
		object.R = 0.0;
		object.E = 0.0;
		object.D = 0.0;
		object.DLI = 0.0;

		//                  console.log(object);

	    }


	    var payload = [];

	    payload.push(object);

	    var message = JSON.stringify(payload);

	    ws.send(message,function(){
		console.log("Sent:     %s", message);
	    });

	});

    }
*/
};
