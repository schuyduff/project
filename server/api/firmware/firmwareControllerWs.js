
var fs = require('fs');
var tools = require('../../util/tools');
var compute = require("../../util/compute.js");
var model = require('./firmwareModel');
var context = require('../../server');
var _ = require('lodash');
/*
var self = module.exports = {

    message(msg,ws,req){
	console.log("Received: %s",msg);
    }
    
};
*/

exports.message = function(msg,ws,req){

    console.log("Received: %s",msg);

    if (msg == 'init'){

	self.init(ws,msg);
	
    } else {

	self.catch_and_log(ws,msg);
	
    } 

};

var self = {

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

    },

    catch_and_log(ws,msg){

	var object = JSON.parse(msg)[0];
	//  console.log(object);
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


	    context.expressWs.getWss('/api/client/socket').clients.forEach(function(client){

		if (client.upgradeReq.baseUrl == '/api/client'){
		    //                      console.log(client.upgradeReq.baseUrl);
		    client.send(message);
		}


	    });



	});

	
    }
};
