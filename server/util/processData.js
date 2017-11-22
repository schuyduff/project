
var _ = require('lodash');
var _sun = require('suncalc');
var Promise = require("bluebird");
var fs = require("fs");
var glob = require("glob");
var csv = require("csvtojson");

Promise.promisifyAll(fs);

fs.existsAsync = Promise.promisify
(function exists2(path, exists2callback) {
    fs.exists(path, function callbackWrapper(exists) { exists2callback(null, exists); });
});

/*
var Converter = require('csvtojson').Converter;
Promise.promisifyAll(Converter.prototype);
var converter = new Converter();
*/
/*
var Converter = Promise.promisifyAll(require("csvtojson")).Converter;

Promise.promisifyAll(Converter.prototype);

var conversionJsons = Promise.promisifyAll(jsons);

function jsons (data){
    return {
	then: function(callback){
	    var convertion = Promise(function(resolve, reject){
		var converter = new Converter({});
		var output="";
		converter.fromStringAsync(data).then(function(result){
		    console.log('processing');
		    return result;
		});

	    });
	}
    };
}
*/



var self = module.exports = {

    getFiles(path){
	
	return new Promise(function(resolve,reject){
	    
	    try {
		
		glob(path,function(err,fileNames){
		    
		    return err ? reject(err) : resolve(fileNames);
		});
		
		
	    } catch(e){
		
		return reject(e);
	    }
	});

	    
    },

    fileExists(filePath){

	var filePathNew = filePath.slice(filePath.lastIndexOf('/'));
	filePathNew = filePathNew.slice(0,filePathNew.lastIndexOf('.'));
	filePathNew = "./public/assets/processed"+filePathNew+".json";

	return fs.existsAsync(filePathNew)
	    .then(function resolve(exists){
		if(!exists){
		    return filePath;
		} else {
		    return null;
		}
	    }, function reject(err){
		return err;
	    });

    },

    readFile(filePath){

	
	var filePathNew = filePath.slice(filePath.lastIndexOf('/')+1);
	filePathNew = filePathNew.slice(0,filePathNew.lastIndexOf('.'));
	
//	console.log(filePathNew);
	return fs.readFileAsync(filePath,'utf-8')
	    .then(function resolve(file){

		return {
		    fileName:filePathNew,
		    contents:file
		};

	    },function reject(err){
		return err;
	    });
    },
    
    csvToJson(file){

//	console.log(file.contents);
//	console.log(file.fileName);
//	console.log(file.contents.slice(0,1000));
	
	return new Promise(function(resolve,reject){
	    try{

		var body = [];

		csv({
		    
		    toArrayString:false,
		    noheader:true,
		    headers:['Year','Month','Day','Hour','Minute','GHI'],
		    includeColumns:['Year','Month','Day','Hour','Minute','GHI']
		    
		})
		    .fromString(file.contents.toString())
		    .on('data',(csvRow)=>{
			
		//	console.log(csvRow.toString());
			body.push(JSON.parse(csvRow.toString('utf-8')));
		    })
		    .on('end',()=>{			
			return resolve({
			    fileName:file.fileName,
			    contents:_.slice(body,2)
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

  },
    
    format(_file) {
	var file = _file.contents;
	//console.log(file);
	return new Promise(function(resolve,reject){

	    try {

		for (i = 0; i < file.length; i++){
		    
		    file[i] = self.GHItoPPFD(file[i]);
		    file[i] = self.linearDate(file[i]);
		    file[i] = self.linearHours(file[i]);
		    file[i] = self.getSunrise(file[i]);
		}

		return resolve({
		    fileName: _file.fileName,
		    contents:file
		});

	    } catch(e) {
		return reject(e);
	    }
	    
	});

    },

    linearDate(elem){
	
	elem.Month = elem.Month - 1;
	var now = new Date(elem.Year,elem.Month,elem.Day);
	var start = new Date(now.getFullYear(), 0, 0);
	var diff = Math.abs(now - start);
	var oneDay = 1000 * 60 * 60 * 24;
	var day = Math.floor(diff / oneDay);
	day = ("00"+day).slice(-3);
	elem.Day365 = day;
	
	return elem;

    },

    linearHours(elem){

	var d = new Date(elem.Year,elem.Month,elem.Day,elem.Hour,elem.Minute);
	elem.T = d.getTime()/1000;

	if (elem.Minute == 30){
	    elem.LinearHours = parseInt(elem.Hour) + 0.5;
	} else {
	    elem.LinearHours = parseInt(elem.Hour);
	}
	
	return elem;
    },

    getSunrise(elem){

	var date = new Date(elem.Year, elem.Month, elem.Day);
	
	var lat = 42;
	var long = -76;
	
	var sun = _sun.getTimes(date,lat,long);
	var timeZoneOffset = -5*3600000;
	
	var sunrise = new Date(sun.sunrise.getTime()+timeZoneOffset);
	
	var sunset = new Date(sun.sunset.getTime()+timeZoneOffset);

	elem.Sunrise = sunrise;
	elem.Sunset = sunset;
	
	return elem;
	
    },
    
    GHItoPPFD(elem){
	
	var PPFD = elem.GHI / 0.457;
	elem.L = PPFD; 
	elem.LL = 0.0;
	return elem;
	
    },

    computeDLI(_file){
//	console.log(_file);
	var file = _file.contents;
//	console.log(file);
	return new Promise(function(resolve,reject){

	    try {

		var secondsOn = (_file.fileName == 'tmy') ? 3600.0 : 1800;

		var PPFD_count = file[0].L;

		file[0].DLI = self.PPFDtoDLI(PPFD_count,secondsOn);


		for (i=1;i<file.length;i++){

		    if(file[i].Sunrise.getHours() == parseInt(file[i].Hour) && parseInt(file[i].Minute) === 0){

			PPFD_count = 0.0;

		    }


		    PPFD_count += file[i].L + file[i].LL;

		    file[i].DLI = self.PPFDtoDLI(PPFD_count,secondsOn);



		}
		return resolve({
		    fileName:_file.fileName,
		    contents:file
		    
		});
		
	    } catch(e){
		return reject(e);
	    }

	});

    },

    PPFDtoDLI(PPFD, secondsOn){
	return PPFD * 3600.00 / 1000000.0 * (secondsOn / 3600.0) ;
    },

    logStats(_file){
	var file = _file.contents;
	return new Promise(function(resolve,reject){

	    try {


		//var json = JSON.parse(file);                                                                                                                                                                           //      console.log(_.take(file,2));
		//      console.log(_.take(file, 5));
		//      console.log(_.nth(file,file.length/2));
		
		
		var days = new Array(366);
		
		var DLIs = [];
		for(i = 1; i < days.length; i++){
		    days[i]=i;
		}
		

		days.forEach(function(elem, i){
		    
		    var index = _.findLastIndex(file,(elem)=>{return parseInt(elem.Day365) == i;});
		    DLIs.push(file[index].DLI);

		});

		var max = Math.max.apply(null,DLIs);
		var min = Math.min.apply(null,DLIs);
		
		console.log("Max DLI: %s",max);
		console.log("Min DLI: %s",min);
		
		return resolve({
		    fileName:_file.fileName,
		    contents:file
		});

	    } catch(e){
		return reject(e);
	    }
	    

	});
	

    },

    writeFile(file){

//	console.log(file.fileName);
//	console.log(JSON.stringify(file.contents));
	var fileName = file.fileName;
	console.log(fileName);

	return fs.writeFileAsync('./public/assets/processed/'+fileName+'.json',JSON.stringify(file.contents))
	    .then(function resolve(){
		
		return file;
	    },function reject(err){
		return err;
	    });
	   
/*
	return new Promise(function(resolve,reject){

	    try {
		
		
	    } catch(e){
		return reject(e);
	    }


	});
*/	


    }
		  

   
    


    
};
