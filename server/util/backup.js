
var config = require('../config/config');

var exec = require('child_process').exec, child;

var Promise = require("bluebird");
var Particle = require('particle-api-js');
var particle = new Particle();
var token;
var csv = require("csvtojson");




Date.prototype.isLeapYear = function() {
    var year = this.getFullYear();
    if((year & 3) !== 0) return false;
    return ((year % 100) !== 0 || (year % 400) === 0);
};

Date.prototype.getDOY = function() {
    var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var mn = this.getMonth();
    var dn = this.getDate();
    var dayOfYear = dayCount[mn] + dn;
    if(mn > 1 && this.isLeapYear()) dayOfYear++;
    return dayOfYear;
};

var self = module.exports = {

    login(){
		
	return new Promise(function(resolve,reject){
	    
	    try{

		return particle.login({username: config.particle.user, password: config.particle.pass}).then(

		    function(data) {
			console.log("Particle Login Successful!");
			token = data.body.access_token;
			return resolve(token);
		    },

		    function (err) {
			console.log('Could not log in.', err);
			return reject(err);
		    }

		);
		
	    } catch(e){

		console.log("Error at backup.login!");
		return reject(e);

	    }

	});

    },

    listDevices(token){

	return new Promise(function(resolve,reject){

	    try{

		var devicesPr = particle.listDevices({ auth: token });

		return devicesPr.then(

		    function(devices){


			devices = devices.body.filter(function(elem){return elem.name == 'binary' || elem.name == 'modulation';});
			
			devices.forEach(function(elem){
			    elem.token = token;
			});
			
			console.log('Devices: ', devices);
			
			return resolve(devices);

		    },

		    function(err) {
			console.log('List devices call failed: ', err);
			return reject(err);
		    }

		);
		
	    } catch(e){
		
		console.log("Error at backup.setPPFDtarget!");
		return reject(e);

	    } 
	});
    },

    
    setPPFDtarget(device){
	
	return new Promise(function(resolve,reject){

	    try{



		console.log();
		console.log();
		console.log();

		var date = new Date();
		var day = date.getDOY();
		var index = day%5; 
		console.log("DAY OF YEAR: ", index);

		var PPFD_targets = [100,200,300,400,500];

		
		var fnPr = particle.callFunction({ deviceId: device.name, name: 'brew', argument: ''+PPFD_targets[index], auth: device.token });

		return fnPr.then(
		    
		    function(data) {


			return resolve(data);
			
		    }, function(err) {

			console.log('An error occurred:', err);
			return reject(err);

		    });
		
	    } catch(e){
		
		console.log("Error at backup.setPPFDtarget!");
		return reject(e);

	    } 
	});
    },

    prepKeys(keys){
	return new Promise(function(resolve,reject){

	    try{

		return resolve(keys);
		
	    } catch(e){
	
		console.log("Error at backup.prepKeys!");
		return reject(e);

	    }
	});
    },
    
    download(data){
	console.log(data);
	return new Promise(function(resolve,reject){

	    try {

		var date = new Date(Date.now() - (3600000*5));

		var command_download = '';
		
		if (data == 'modulations'){

		    command_download = 'mongoexport -h ds135777.mlab.com:35777 -d heroku_w9stt6kn -c modulations -u username -p password -o ./public/assets/backup/modulation_'+date.getFullYear()+'_'+date.getMonth()+'_'+date.getDate()+'_T_'+date.getHours()+'_'+date.getMinutes()+'_'+date.getSeconds()+'.csv --type=csv -f T,L,LL,R,E,D,DLI,Year,Month,Day,Hour,Minute,Second,Day365,Hour24,Sunrise,Sunset';
		    
		    
		} else if (data == 'binary'){

		    command_download = 'mongoexport -h ds135777.mlab.com:35777 -d heroku_g2ltclsl -c bins -u username -p password -o ./public/assets/backup/binary_'+date.getFullYear()+'_'+date.getMonth()+'_'+date.getDate()+'_T_'+date.getHours()+'_'+date.getMinutes()+'_'+date.getSeconds()+'.csv --type=csv -f T,L,LL,R,E,D,DLI,Year,Month,Day,Hour,Minute,Second,Day365,Hour24,Sunrise,Sunset';
		    
		}

		return exec(command_download,
		     
		     function (error, stdout, stderr) {
			 
			 if (error !== null) {
			     
			     console.log('exec error: ' + error);
			     
			 } else {
			     
			     console.log('stdout: ' + stdout);
			     console.log('stderr: ' + stderr);

			     console.log('Function called succesfully:', data);
			     return resolve(data);
			 }
	     });
	

	    } catch(e){

		return reject(e);

	    }


	});

			
    },

    drop(data){

	return new Promise(function(resolve,reject){


	    try {


		var command_drop = '';
		
		if (data == 'modulations'){

		    command_drop = "mongo ds135777.mlab.com:35777/heroku_w9stt6kn -u username -p password --eval 'db.modulations.drop()'";
		    
		    
		} else if (data == 'binary'){

		    command_drop = "mongo ds135777.mlab.com:35777/heroku_g2ltclsl -u username -p password --eval 'db.bins.drop()'";
		    
		}
		
		return exec(command_drop,
		     
		     function (error, stdout, stderr) {
			 
			 if (error !== null) {
			     
			     console.log('exec error: ' + error);
			     return reject(error);
			     
			 } else {
			     
			     console.log('stdout: ' + stdout);
			     console.log('stderr: ' + stderr);
			     return resolve(data);
			 }
			 
	     });
	

	    } catch(e){

		return reject(e);

	    }



	     
	});
	
    },

    csvToJSON(file){

	return new Promise(function(resolve,reject){
	    try{

		var body = [];

		csv({

		    toArrayString:false,
		    noheader:false
		    //headers:['Year','Month','Day','Hour','Minute','GHI'],
		    //includeColumns:['Year','Month','Day','Hour','Minute','GHI']

		})
		    .fromString(file.contents.toString())
		    .on('data',(csvRow)=>{

			body.push(JSON.parse(csvRow.toString('utf-8')));
		    })
		    .on('end',()=>{
			return resolve({
			    fileName:file.fileName,
			    // contents:_.slice(body,3)
			     contents:body
			});
		    })
		    .on('error',(err)=>{
			return reject(err);
		    })
		    .on('error',(err)=>{
			console.log(err);
			return reject(err);
		    })
		;

	    } catch(e){
		return reject(e);
	    }

	});


    }


    

};
