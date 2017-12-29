
var config = require('../config/config');

var exec = require('child_process').exec, child;

var Promise = require("bluebird");
var Particle = require('particle-api-js');
var particle = new Particle();
var token;





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

    
    download(data){

	return new Promise(function(resolve,reject){

	    try {

		var date = new Date(Date.now() - (3600000*5));

		var command_download = '';
		
		if (data.body.id == config.particle.modulation){

		    command_download = 'mongoexport -h ds135547.mlab.com:35547 -d heroku_4f0dk9pz -c modulations -u username -p password -o modulation_'+date.toISOString()+'.csv --type=csv -f T,L,LL,R,E,D,DLI,Year,Month,Day,Hour,Minute,Second,Day365,Hour24,Sunrise,Sunset';
		    
		    
		} else if (data.body.id == config.particle.binary){

		    command_download = 'mongoexport -h ds135777.mlab.com:35777 -d heroku_g2ltclsl -c bins -u username -p password -o binary_'+date.toISOString()+'.csv --type=csv -f T,L,LL,R,E,D,DLI,Year,Month,Day,Hour,Minute,Second,Day365,Hour24,Sunrise,Sunset';
		    
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
		
		if (data.body.id == config.particle.modulation){

		    command_drop = "mongo ds135547.mlab.com:35547/heroku_4f0dk9pz -u username -p password --eval 'db.modulations.drop()'";
		    
		    
		} else if (data.body.id == config.particle.binary){

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
	
    }


    

};
