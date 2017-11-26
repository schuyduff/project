var router = require('express').Router();
var fs = require('fs');
var controller = require('./clientController.js');



router.param('lookback',controller.param_lookback);

router.param('year',controller.param_year);

router.route('/stream/lookback/:lookback').get(controller.lookback);

router.route('/stream/yesterday').get(controller.yesterday);

router.route('/stream/today').get(controller.today);

router.route('/year/:year').get(controller.year);

router.route('/day/:year').get(controller.day);

router.route('/datalogger/:year').get(controller.datalogger);

router.route('/rules/:year').get(controller.rules);

router.ws("/socket",function(ws,req){

    console.log("Websocket Connection with Client!" );
/*
    setInterval(() => {
	ws.send("Hello world!");
    }, 1000);
*/
    
    ws.on("message",function(msg){
	console.log(msg);
	//	ws.send(msg);
	

    });

    ws.on("close", function(){
	console.log("Websocket Disconnected from Client!");
	
    });

    ws.on("error",function(){
	console.log("Error! Connection Terminated!");
	ws.terminate();
    });
    
    
});


module.exports = router;
