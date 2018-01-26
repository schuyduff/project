
process.env.NODE_ENV = 'modulation';

var config = require('./server/config/config');

console.log(config);

var context = require('./server/server');
var mongoose = require('mongoose');
var fs = require('fs');
var v8 = require('v8');
var backup = require('./server/util/backup');
var schedule = require('node-schedule');
var processData = require('./server/util/processData.js');
var oncePerMinute = '0 * * * * *';
var oncePerDay = '0 34 12 * * *';

if (config.backup){    
    
    var j = schedule.scheduleJob(oncePerDay,function(){

	
	backup.login()
	    .then(backup.listDevices).map(function(device){
		
		return backup.setPPFDtarget(device);
	  
	    },{concurrency:2})
	    .then((result)=>{
		console.log(result);
	    })
	    .catch((e)=>{
		console.log("Error at index.js: %s",e.message);
		console.log(e);
		
	    });

	backup.prepKeys(['modulations','binary']).map(function(data){

	    return backup.download(data)
		.then(backup.drop);
	    
	}, {concurrency:2})

	    .then((result)=>{
		console.log(result);
	    })
	    .catch((e)=>{
		console.log("Error at index.js: %s",e.message);
		console.log(e);
	    });
	
    });
    
}


var date = new Date(Date.now() - (3600000*5));

var filePath = './public/assets/backup/modulation_'+date.getFullYear()+'_'+date.getMonth()+'_'+date.getDate()+'_T_7_34_0.csv';

processData.readFile(filePath)
    .then(backup.csvToJSON)
    .then((file)=>{
	return processData.writeFile(file, file.fileName);
    })
    .then((result)=>{
	//console.log(result);
	console.log("Done processing backup file!");
}).catch((e)=>{
    console.log("Error on index.process: %s",e.message);
});

mongoose.connect(config.db.url, {useMongoClient:true});

context.server.listen(config.port);
console.log("Listening on http://localhost:"+config.port);

//console.log(process.memoryUsage());

