var fs = require('fs');
var process = require('./processData.js');
var Promise = require("bluebird");
Promise.promisifyAll(fs);


fs.existsAsync = Promise.promisify
(function exists2(path, exists2callback) {
    fs.exists(path, function callbackWrapper(exists) { exists2callback(null, exists); });
});

var self = module.exports = {


    targetExists(filePath){

	var filePathNew = filePath.slice(filePath.lastIndexOf('/'));
	filePathNew = filePathNew.slice(0,filePathNew.lastIndexOf('.'));
	filePathNew = "./public/assets/processed"+filePathNew+".json";

	return fs.existsAsync(filePathNew)
	    .then(function resolve(exists){

		if(exists){
//		    console.log(filePath);
		    return filePath;

		} else {

		    throw new Error("File does not exist!\n");

		}
	    }, function reject(err){
		return err;
	    });

    },

    missing(file){
//	console.log(file);
	return new Promise(function(resolve,reject){

	    try{

		var log = file.contents;

		var days = [];
		var missing = [];

		for (i=0;i<log.length;i++){

		//    var date = dateTo365.mathOnly(log[i].Year,log[i].Month,log[i].Day);
		    var date = log[i].Day365;

		    if (i<10*48){
//			console.log(log[i]);
		    }
		    
		    if(!days.includes(date) && log[i].LL !== null){
			days.push(parseInt(date));
		    }
		}



		for (i=1;i<366;i++){
		    if(!days.includes(i)){
			missing.push(i);
		    }

		}
		//console.log(days);
		console.log("Missing Days: ");
		console.log(missing);

		
		return resolve(file);
	    } catch(e){
		reject(e);
	    }
	});
    },

    convertJSON(file){
	return new Promise(function(resolve,reject){

	    try{

		var contents = JSON.parse(file.contents);
		file.contents = contents;
		
		resolve(file);
	    } catch(e){
		return reject(e);
	    }
	});
    }

};
