var fs = require('fs');
var process = require('./processData.js');

var self = module.exports = {


    targetExists(filePath){

	var filePathNew = filePath.slice(filePath.lastIndexOf('/'));
	filePathNew = filePathNew.slice(0,filePathNew.lastIndexOf('.'));
	filePathNew = "./public/assets/processed"+filePathNew+".json";

	return fs.existsAsync(filePathNew)
	    .then(function resolve(exists){

		if(exists){

		    return filePath;

		} else {

		    throw new Error("File does not exist!");

		}
	    }, function reject(err){
		return err;
	    });

    },

    missing(file){
	return new Promise(function(resolve,reject){

	    try{
		
		var log = JSON.parse(file.contents);

		var days = [];
		var missing = [];

		for (i=0;i<log.length;i++){


		//    var date = dateTo365.mathOnly(log[i].Year,log[i].Month,log[i].Day);
		    var date = log[i].Day365;
		    		    
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
//		console.log(missing);

		
		return resolve(file);
	    } catch(e){
		reject(e);
	    }
	});
    }

};
