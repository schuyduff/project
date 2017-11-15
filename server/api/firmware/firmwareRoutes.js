var router = require('express').Router();
var fs = require('fs');
var tools = require('../../util/tools');
var compute = require("../../util/compute.js");
var controller = require('./firmwareController');



router.route('/day/:day').get(function(req,res, next){

//    console.log(parseInt(req.params.day));
    var year = 2013;
    var formatted = JSON.parse(fs.readFileSync("./public/assets/"+year+"_PPFD_half_hourly.json", 'utf8'));
    
    //    console.log(formatted.length);
    
    // console.log(formatted);

    var transmit = formatted.filter(function(item){
    
    return (item.Day365 == parseInt(req.params.day));
    
    });

  //  console.log(transmit[0]);
    
    compute.PPFD_Day365_only_hourly(transmit, function(_data){
	//          console.log(_data);
	//          console.log("Transmitted length: "+_data.length);
	res.json(_data);
	next();

    });

    


});


router.route('/datalogger').post(function(req,res,next){
    //    console.log(req.body);
    //    tools.datalogger(req.body);
    //    buffer = buffer.concat(req.body);
    //    console.log("Buffer length: "+ buffer.length);
    //    console.log(buffer);
    
//    var body = JSON.parse(req.body);
    console.log("");
    console.log(req.body.data);
    console.log("");
    res.send("received");
    
    //next();
    
});


/*
router.ws("/socket",function(ws,req){
    
    ws.send({"Hello!":1});
    
});
*/



router.ws("/socket",controller.ws);

/*
	  function(ws,req){

    console.log("Websocket Connection with Firmware!" );


    var id = setInterval(function() {

	ws.send("Hello from Server!");

    }, 1000);

    
    ws.on("message",function(msg){
//	console.log("Received: %s",msg);

	var payload = JSON.parse(msg);

	tools.datalogger(payload);
	//wss.broadcast(message);

	payload = tools.payload(payload[0]);
//	console.log(payload);
	ws.send(payload,function(){
//	    console.log("Sent:     %s", payload);
	});
	
    });

    ws.on("close", function(){
	console.log("Websocket Disconnected from Client!");

	try {

	    clearInterval(id);

	} catch (e){
	    //console.log("catch error");
	}
    });
    
    ws.on("error",function(){
	console.log("Error! Connection Terminated!");
	ws.terminate();
    });


    
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
	
	console.log("Sent:     %s", message);
    });


});
*/

module.exports = router;
