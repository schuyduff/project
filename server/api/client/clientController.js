var fs = require('fs');
var model = require('../firmware/firmwareModel.js');


exports.param_lookback = function(req,res,next,lookback){
   // console.log("Lookback %s",lookback);
    req.lookback = lookback;
    next();
};

exports.param_year = function(req,res,next,year){

    req.year = year;
    next();
};


exports.lookback = function(req,res,next){
//    console.log("ran lookback");

    model.getMany(req.lookback,function(err,doc){

	if (err) {

	    next(err);

	}
	else {
	//    console.log(doc);
	    res.json(doc);
	}
	
	
    });
   
};

exports.year = function(req,res,next){

    var options = {
	root: './public/assets/',
	dotfiles: 'deny',
	headers: {
	    'x-timestamp': Date.now(),
	    'x-sent': true
	}
    };

    var fileName = req.year+".json";
    
    res.sendFile(fileName, options, function (err) {
	if (err) {
	    next(err);
	} else {
	    console.log('Sent:', fileName);
	}
    });
        
};

exports.day = function(req,res,next){


    var options = {
	root: './public/assets/',
	dotfiles: 'deny',
	headers: {
	    'x-timestamp': Date.now(),
	    'x-sent': true
	}
    };

    var fileName = req.year+"_PPFD_half_hourly.json";
    
    res.sendFile(fileName, options, function (err) {
	if (err) {
	    next(err);
	} else {
	    console.log('Sent:', fileName);
	}
    });


};


exports.datalogger = function(req,res,next){


    var options = {
	root: './public/assets/datalogger/',
	dotfiles: 'deny',
	headers: {
	    'x-timestamp': Date.now(),
	    'x-sent': true
	}
    };

    var fileName = req.year+".json";
    
    res.sendFile(fileName, options, function (err) {
	if (err) {
	    next(err);
	} else {
	    console.log('Sent:', fileName);
	}
    });


};


exports.rules = function(req,res,next){


    var options = {
	root: './public/assets/',
	dotfiles: 'deny',
	headers: {
	    'x-timestamp': Date.now(),
	    'x-sent': true
	}
    };

    var fileName = req.year+"_rules.json";
    
    res.sendFile(fileName, options, function (err) {
	if (err) {
	    next(err);
	} else {
	    console.log('Sent:', fileName);
	}
    });


};

