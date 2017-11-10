var fs = require('fs');


exports.param = function(req,res,next,lookback){
   // console.log("Lookback %s",lookback);
    req.lookback = lookback;
    next();
};

exports.lookback = function(req,res,next){
    
 //   console.log("lookback route");
    var year = "2015";

    var formatted = JSON.parse(fs.readFileSync("./public/assets/datalogger/"+year+".json", 'utf8'));
    var transmit = formatted.slice(-req.lookback);

    if (transmit){

	res.json(transmit);

    } else {
  
	next();
    }   
};



