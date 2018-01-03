console.log(process.env);

process.env.NODE_ENV = 'modulation';

var config = require('./server/config/config');

console.log(config);

var context = require('./server/server');
var mongoose = require('mongoose');
var fs = require('fs');
var v8 = require('v8');
var backup = require('./server/util/backup');
var schedule = require('node-schedule');

var oncePerMinute = '0 * * * * *';
var oncePerDay = '0 34 12 * * *';

if (config.backup){    
    
    var j = schedule.scheduleJob(oncePerDay,function(){

	
	backup.login()
	    .then(backup.listDevices).map(function(device){
		
		return backup.setPPFDtarget(device)
		    .then(backup.download)
		    .then(backup.drop);
	  
	    },{concurrency:2})
	    .then((result)=>{
		console.log(result);
	    })
	    .catch((e)=>{
		console.log("Error at index.js: %s",e.message);
		console.log(e);
		
	    });
	
    });
    
}

mongoose.connect(config.db.url, {useMongoClient:true});

context.server.listen(config.port);
console.log("Listening on http://localhost:"+config.port);

//console.log(process.memoryUsage());

