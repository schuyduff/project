
var fs = require('fs');
var tools = require('../../util/tools');
var compute = require("../../util/compute.js");
var model = require('./firmwareModel');
var context = require('../../server');
var _ = require('lodash');
var firmwareControllerWs = require('./firmwareControllerWs');

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
    console.log(req.body);   
//    tools.datalogger(req.body);
    
    res.send("Logged.");

    
};

exports.ws = function(ws,req){

    console.log("Websocket Connection with Firmware!" );
    
    ws.on('message',(msg)=>{firmwareControllerWs.message(msg,ws,req);});

    ws.on("close", function(){
	console.log("Websocket Disconnected from Client!");
	
    });
    
    ws.on("error",function(){
	console.log("Error! Connection Terminated!");
	ws.terminate();
    });
    
	  
};
