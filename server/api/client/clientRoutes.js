var router = require('express').Router();
var fs = require('fs');
var controller = require('./clientController.js');

router.param('lookback',controller.param);

router.route('/:lookback').get(controller.lookback);
    /*
router.route("/lookback/:lookback").get(function(req,res,next){

    

    var input = parseInt(req.params.lookback);

    console.log(input);

    var _year = "2015";

    var formatted = JSON.parse(fs.readFileSync("./public/assets/datalogger/"+_year+".json", 'utf8'));
  
 //   var transmit = formatted.filter(function(item){

//        return item.T >= input;
  //  });
   
    var transmit = formatted.slice(-input);
    //    console.log(transmit[0]);
    //    console.log("StreamGraph GET Length: "+transmit.length);
    buffer = [];
    res.json(transmit);
    next();

});
*/

router.ws("/socket",function(ws,req){

    console.log("Websocket Connection with Client!" );
       
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
