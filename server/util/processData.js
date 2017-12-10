
var _ = require('lodash');
var _sun = require('suncalc');
var Promise = require("bluebird");
var fs = require("fs");
var glob = require("glob");
var csv = require("csvtojson");
var compute = require('./compute.js');


Promise.promisifyAll(fs);

fs.existsAsync = Promise.promisify
(function exists2(path, exists2callback) {
    fs.exists(path, function callbackWrapper(exists) { exists2callback(null, exists); });
});

var self = module.exports = {

    getFiles(path){
	
	return new Promise(function(resolve,reject){
	    
	    try {
		
		glob(path,function(err,fileNames){
		    
		    if (!fileNames[0]){return reject(new Error("No files at this wildcard!"));}
		    return err ? reject(err) : resolve(fileNames);
		});
		
		
	    } catch(e){
		
		return reject(e);
	    }
	});

	    
    },

    targetNotExists(filePath){
	
	var filePathNew = filePath.slice(filePath.lastIndexOf('/'));
	filePathNew = filePathNew.slice(0,filePathNew.lastIndexOf('.'));
	filePathNew = "./public/assets/processed"+filePathNew+".json";

	return fs.existsAsync(filePathNew)
	    .then(function resolve(exists){

		if(!exists){

		    return filePath;

		} else {
		    
		    throw new Error("File exists already!\n");

		}
	    }, function reject(err){
		return err;
	    });

    },

    readFile(filePath){
	
	var filePathNew = filePath.slice(filePath.lastIndexOf('/')+1);
	filePathNew = filePathNew.slice(0,filePathNew.lastIndexOf('.'));
//	console.log(filePath);
	//console.log(filePathNew);
	return fs.readFileAsync(filePath,'utf-8')
	    .then(function resolve(file){
//		console.log(file);
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
			body.push(JSON.parse(csvRow.toString('utf-8')));
		    })
		    .on('end',()=>{			
			return resolve({
			    fileName:file.fileName,
			    contents:_.slice(body,3)
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
		    file[i].LL = null;
		    file[i].R = null;
		    file[i].DLInew = 0.0;
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
	//day = ("00"+day).slice(-3);
	
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
	var secondsInDay = 86400000;
	var sunrise = new Date(sun.sunrise.getTime()+timeZoneOffset+secondsInDay);
	
	var sunset = new Date(sun.sunset.getTime()+timeZoneOffset+secondsInDay);

	elem.Sunrise = sunrise;
	elem.Sunset = sunset;
	
	return elem;
	
    },
    
    GHItoPPFD(elem){
	
	var PPFD = elem.GHI / 0.457;
	elem.L = PPFD; 

	return elem;
	
    },

    computeDLI(_file){
//	console.log(_file.contents);
	var file = JSON.parse(JSON.stringify(_file.contents));
//	console.log(file);
	return new Promise(function(resolve,reject){

	    try {

		var secondsOn = (_file.fileName == 'tmy') ? 3600.0 : 1800;

		var PPFD_count = parseFloat(file[0].L);
		var LL_count = parseFloat(file[0].LL);
		
		file[0].DLI = self.PPFDtoDLI(PPFD_count,secondsOn);
		file[0].DLInew = self.PPFDtoDLI(LL_count,secondsOn);

		var count = 0;
		
		for (i=1;i<file.length;i++){


		    
		    if(new Date(file[i].Sunrise).getHours() == parseInt(file[i].Hour) && parseInt(file[i].Minute) === 0){

			PPFD_count = 0.0;
			LL_count = 0.0;
			count++;
		    }

		    
		    PPFD_count += parseFloat(file[i].L);
		    LL_count += parseFloat(parseFloat(file[i].LL) + parseFloat(file[i].L));

		    
		    file[i].DLI = self.PPFDtoDLI(PPFD_count,secondsOn);
		    file[i].DLInew = self.PPFDtoDLI(LL_count,secondsOn);

//		    console.log(file[i].DLInew);

		}

//		console.log("DLI reset count: %s",count);

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
	return parseFloat(PPFD) * 3600.00 / 1000000.0 * (secondsOn / 3600.0) ;
    },

    logStats(_file){

	var file = _file.contents;
	
	return new Promise(function(resolve,reject){

	    try {


		//var json = JSON.parse(file);                                                                                                                                                                           //      console.log(_.take(file,2));
		//      console.log(_.take(file, 5));
		//      console.log(_.nth(file,file.length/2));
		
		
		var days = new Array(366);
		
		var DLI = [];
		var DLInew = [];
		
		for(i = 1; i < days.length; i++){
		    days[i]=i;
		}
		

		days.forEach(function(elem, i){

		    var chunk = file.filter(function(elem){
			return elem.Day365 == i;
		    });
		    
		    var DLIday = Math.max.apply(null,chunk.map(function(elem){return elem.DLI;}));
		    var DLIdayNew = Math.max.apply(null,chunk.map(function(elem){

			return (elem.DLInew) ? elem.DLInew : -Infinity;

		    }));
		    //console.log(DLIday);
//		    console.log(DLIdayNew);

		    
			DLI.push(DLIday);
			DLInew.push(DLIdayNew);
		    

		});
		
		//console.log(DLI.length);
	//	console.log(DLInew.length);
		//vconsole.log(DLI);

		var max = Math.max.apply(null,DLI);
		var min = Math.min.apply(null,DLI);
		var maxNew = Math.max.apply(null,DLInew);
		var minNew = Math.min.apply(null,DLInew);

		var year = file[0].Year;
		
		console.log(year);
		console.log("Max DLI: %s",max);
		console.log("Min DLI: %s\n",min);
		console.log("Max DLInew: %s",maxNew);
		console.log("Min DLInew: %s\n",minNew);

		return resolve({
		    fileName:_file.fileName,
		    contents:file
		});

	    } catch(e){
		return reject(e);
	    }
	    

	});
	

    },

    writeFile(file, fileName){
	
	//	console.log(file.fileName);
//	console.log(file.contents);
//	console.log(JSON.stringify(file.contents));
//	var fileName = file.fileName;
//		console.log(fileName);

	return fs.writeFileAsync('./public/assets/processed/'+fileName+'.json',JSON.stringify(file.contents))
	    .then(function resolve(){		
		return file;
	    },function reject(err){
		return err;
	    });
	   
    },

    getChunk(file, day){

	return new Promise(function(resolve,reject){
	    try{
		var fullData = JSON.parse(file.contents);
		
		var chunk = fullData.filter(function(elem){
		    return elem.Day365 == parseInt(day);
		});
		
		chunk.forEach(function(elem,index){
		    chunk[index] = _.pick(elem,["T","L"]);
		    chunk[index].L = ""+chunk[index].L;
		});

//		console.log(chunk);

		return resolve({
		    fileName:file.fileName,
		    contents:fullData,
		    chunk:chunk
		});
	    } catch(e){
		return reject(e);
	    }
	});

    },
    
    datalogger(file,reqBody){

	return new Promise(function(resolve,reject){

	    try{



		var newData = JSON.parse(JSON.stringify(reqBody));
		var oldData = JSON.parse(file.contents);
//		console.log("Type of reqBody: %s",typeof reqBody);		
//		console.log("Type of oldData %s",typeof oldData);		
//		console.log(newData);
		
		newData.forEach(function(item){
		  //  console.log(item);
		    var index = oldData.findIndex(function(elem){return elem.T == item.T;});
		    oldData[index] = _.assign(oldData[index], item);
		   // console.log(item);
		    //console.log(oldData[index]);
		});

		file.contents = oldData;

		
		return resolve(file);


	    } catch(e){
		return reject(e);
	    }


	});
    },

    ruleSum(file){

	return new Promise(function(resolve,reject){

	    try{

		compute.rule_accumulator(file.contents,function(days){

		    var _fileName = file.fileName + "_rules";

		    return resolve({
			fileName:_fileName,
			contents:days
		    });
		    
		});
		
		
	    } catch(e){
		return reject(e);
	    }


	});

    }
    
    
		  

   
    


    
};
