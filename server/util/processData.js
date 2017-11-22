var csv = require("csvtojson");
var _ = require('lodash');
var _sun = require('suncalc');
var Promise = require("bluebird");
var fs = require("fs");
Promise.promisifyAll(fs);
var glob = require("glob");



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
    
    csvToJson(file){

	return new Promise(function(resolve,reject){
	    try {
		
		var body = [];
		
		csv({	    
		    headers:['Year','Month','Day','Hour','Minute','GHI'],
		    
		})
		    .fromString(file.toString())
		    .on('data',(csvRow)=>{
			body.push(JSON.parse(csvRow.toString('utf-8')));
		})
		    .on('end',()=>{		
			return resolve(_.slice(body,2));
		    })
		    .on('error',(err)=>{
		    return reject(err);
		    });
		
		
	    } catch(e){
		return reject(e);
	    }
	    
	});
    },
    
    format(file) {

	return new Promise(function(resolve,reject){

	    try {

		for (i = 0; i < file.length; i++){
		    
		    file[i] = self.GHItoPPFD(file[i]);
		    file[i] = self.linearDate(file[i]);
		    file[i] = self.linearHours(file[i]);
		    file[i] = self.getSunrise(file[i]);
		}

		return resolve(file);

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

    computeDLI(file){

	return new Promise(function(resolve,reject){

	    try {

	        var DLI_array = [];
		var DLI_count = self.PPFDtoDLI(file[0].L,1800.0);
		    file[0].DLI = DLI_count;
		var count = 0;
		
		
		for (i=1;i<file.length;i++){
		    
		    if(file[i].Sunrise.getHours() == parseInt(file[i].Hour) && parseInt(file[i].Minute) === 0){
			
			DLI_count = 0.0;

		    }
		    
		    DLI_count += (self.PPFDtoDLI(file[i].L,1800.00) + self.PPFDtoDLI(file[i].LL,1800.00));		    

		    file[i].DLI = DLI_count;


		    
		}
		
		return resolve(file);
		
	    } catch(e){
		return reject(e);
	    }

	});

    },

    PPFDtoDLI(PPFD, secondsOn){
	return PPFD * 3600.00 / 1000000.0 * (secondsOn / 3600.0) ;
    },

    logStats(file){

	return new Promise(function(resolve,reject){

	    try {


		//var json = JSON.parse(file);                                                                                                                                                                           //      console.log(_.take(file,2));
		//      console.log(_.take(file, 5));
		//      console.log(_.nth(file,file.length/2));
		
/*		
		var days = new Array(366);
		
		var DLIs = [];
		for(i = 1; i < days.length; i++){
		    var index = _.findLastIndex(file,(elem)=>{return parseInt(elem.Day365) == i;});
		    DLIs.push(file[index].DLI);
		};
		var max = Math.max.apply(null,DLIs);
		var min = Math.min.apply(null,DLIs);
		
		console.log("Max DLI: %s",max);
		console.log("Min DLI: %s",min);
*/		
		return resolve(file);

	    } catch(e){
		return reject(e);
	    }
	    

	});
	

    },

    writeFile(file){
		
	var year = file[0].Year;
	return fs.writeFileAsync('./public/assets/processed/'+year+'.json',JSON.stringify(file));

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
