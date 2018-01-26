var fs = require('fs');
var model = require('../firmware/firmwareModel.js');
var process = require('../../util/processData.js');

exports.param_lookback = function(req,res,next,lookback){

    req.lookback = lookback;
    next();
};

exports.param_year = function(req,res,next,year){

    req.year = year;
    next();
};

exports.lookback = function(req,res,next){
   
    console.log("Req.lookback: %s",req.lookback);

    model.getMany(req.lookback,function(err,doc){

	if (err) {

	    next(err);

	}
	else {

	    res.json(doc);
	}
	
	
    });

};
exports.yesterdayNew = function(req,res,next){
    var date = new Date(Date.now() - (3600000*5));
    
    var filePath = './public/assets/processed/';
    var fileName = 'modulation_'+date.getFullYear()+'_'+date.getMonth()+'_'+date.getDate()+'_T_7_34_0.json';

    var options = {
	root: filePath,
	dotfiles: 'deny',
	headers: {
	    'x-timestamp': Date.now(),
	    'x-sent': true
	}
    };

    res.sendFile(fileName, options, function (err) {
	if (err) {
	    next(err);
	} else {
	    console.log('Sent:', fileName);
	}
    });




    /*
    process.readFile(filePath)
//	.then(process.csvToJson)
	.then((result)=>{
	    //	    console.log(result);
	    res.json();
	}).catch((e)=>{
	    console.log("Error on clientRoutes.yesterdayNew: %s",e.message);
	});
*/
};

exports.yesterday = function(req,res,next){

    var lookback = 1;

    model.getFullDay(lookback) 
	.then((result)=>{
	    console.log("Request for Yesterday!");
//	    console.log(result);
	    
	    res.json(result);

	}).catch((e)=>{
            console.log("Error: %s",e.message);
	    console.log(e);
	    next(e);
	    
	});


};

exports.today = function(req,res,next){

    var lookback = -1;
    
    model.getFullDay(lookback)
    
	.then((result)=>{
	    console.log("Request for Today!");
//	    console.log(result);
	    
	    res.json(result);

	}).catch((e)=>{
            console.log("Error: %s",e.message);
	    console.log(e);
	    next(e);
	    
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

