var fs = require("fs");
const dateTo365 = require("./dateTo365.js");
var _sun = require('suncalc');

module.exports = {
    DLI(json, callback){

	var data = json;
//	console.log(data);
	var __DLI = [];
	var check = [];
	var scalefactor = 1.0;
	var _DLI = data[0].PPFD*1800.0/1000000.0;

    for (i=1;i<data.length;i++){

	
	if (i==data.length-1){
	   
	    __DLI.push(JSON.parse(`{"Month":${data[i].Month},"Day":${data[i].Day},"Day365":${data[i-1].Day365},"DLI":${_DLI}}`));

	    _DLI=0;
	    
	} else if(data[i].Month === data[i-1].Month && data[i].Day === data[i-1].Day){
	    
	    _DLI += (data[i].PPFD*1800.0/1000000.0);
	    
	} else {

	    
	    check.push(_DLI);
	    __DLI.push(JSON.parse(`{"Month":${data[i-1].Month},"Day":${data[i-1].Day}, "Day365":"${data[i-1].Day365}","DLI":${_DLI}}`));   
	    _DLI=data[i].PPFD*1800.0/1000000.0;

	}
	
    }
	
	//console.log(Math.max.apply(null,check));
	//console.log(Math.max.apply(null,__DLI.map(function(o){return o.DLI;})));
	callback(__DLI);

    },

    process_DLI(data, old, callback){

	//console.log(old);
	
	var index =[];
	for(i=1;i<366;i++){
	    index.push(i);
	}
	
//	console.log(data);

	index.forEach(function(item){
	    
	    var day = data.filter(function(elem){
		return elem.Day365==item;
		    
	    });

	    var DLI = 0;
	    
	    day.forEach(function(elem){

		DLI+= (elem.L*1800/1000000); 
		
	    });

	    old[item-1].newDLI = DLI;
	    
	});

	//console.log(old);
	callback(old);
	
    },

    process_DLI_2(log,old,callback) {
//	console.log(log);
	var DLI_array = [];
	var DLI_count = log[0].L*1800.0/1000000.0;
	var count = 0;
	
	for (i=1;i<log.length;i++){

	    var year = log[i].Year;
	    var month = log[i].Month;
	    var day = log[i].Day;
	    var date = new Date(year, month,day);
	    
	    var lat = 42;
	    var long = -76;
	    
	    var sun = _sun.getTimes(date,lat,long);
	    var timeZoneOffset = -5*3600000;
	   	    
	    var sunrise = new Date(sun.sunrise.getTime()+timeZoneOffset);
	    
	    var sunset = new Date(sun.sunset.getTime()+timeZoneOffset);

	    var index = log[i].Day365-1;

	   // console.log(sunrise.getHours());
	    //console.log(log[i].Hour);
	   // console.log(log[i].Minute);
	    
	    
	    if (i == log.length-1){

		DLI_count += ((log[i].L*1800.0/1000000.0) + (log[i].LL*1800.0/1000000.0));
		old[index].newDLI = DLI_count;
		
	    } else if(sunrise.getHours() == parseInt(log[i].Hour) && parseInt(log[i].Minute) === 0){

		if (index === 0 ){
		    old[index].newDLI = DLI_count;
		}else{
		    old[index-1].newDLI = DLI_count;
		}
		
		DLI_count = ((log[i].L*1800.0/1000000.0) + (log[i].LL*1800.0/1000000.0));

	    } else {

		DLI_count += ((log[i].L*1800.0/1000000.0) + (log[i].LL*1800.0/1000000.0));
	    }
	    
	    
	}
	

	callback(old);
    },
    
    rule_accumulator(log, callback){

	var days = Array.from(Array(365).keys());

	var _days = [];
	
	days.forEach(function(elem){

	    var date = new Date(log[0].T*1000);
	    
	    date = new Date(date.getTime()+86400000*elem);
	    
	    var lat = 42;
	    var long = -76;
	    	    
	    var timeZoneOffset = -5*3600000;
	    
	    var sun = _sun.getTimes(date,lat,long);

	    var round_down = (sun.sunrise.getMinutes()*60000)+(sun.sunrise.getSeconds()*1000);
	    
	    var sunrise = new Date(sun.sunrise.getTime()+timeZoneOffset-round_down);

	    var sunrise_next = new Date(sunrise.getTime()+(3600000*24));
	    
	    var count = 0;
	    
	    var accumulator = {};

	    for(i=0;i<15;i++){
		accumulator[i] = (accumulator[i]||0);
	    }

	    _days.push(log.filter(function(item,index){
		
		var __date = new Date(item.Year, item.Month, item.Day, item.Hour, item.Minute);

		return (__date.getTime() >= sunrise.getTime() && __date.getTime() < sunrise_next.getTime());
			
	    }).reduce(function(accumulator,d,i){
		accumulator.Day365 = elem+1;
     		accumulator.Year = d.Year;
		accumulator[d.R] = (accumulator[d.R]||0) + 1;
		
		return accumulator;
	
	    },accumulator));
	    	
	});
	
		
	callback(_days);
    },

    GHI_to_PPFD(GHI){
	var temp = GHI * 4.6*100;
	Math.floor(temp);
	temp/=100;
	return temp;

    },
    GHI_to_PPFD_NEW(GHI){
	var temp = (GHI /0.457);
//	console.log(temp);
//	Math.floor(temp);
	return temp;
    },

    GHI_to_PPFD_wrapper(_json,callback){
	
	var data = _json;
	for (i=0;i<data.length;i++){
	    
	    data[i].PPFD = this.GHI_to_PPFD_NEW(data[i].GHI);
	    
	}
	
	callback(data);
    },

    LinearHours(_json,callback){


//	console.log(_json);
	for (i=0;i<_json.length;i++){

	    var d = new Date(_json[i].Year,_json[i].Month-1,_json[i].Day,_json[i].Hour,_json[i].Minute);

	    _json[i].T = d.getTime()/1000;

	    
	    
	    _json[i].Month = (_json[i].Month-1); 

	    

	    
	    if (_json[i].Minute == 30){
		_json[i].LinearHours = _json[i].Hour + 0.5;
	    } else {
		_json[i].LinearHours = _json[i].Hour;
	    }
	    
	}
	console.log(_json);
	callback(_json);

    },

    PPFD_Day365_only_hourly(_json,callback){

	var data = [];
	var temp = [];
	//console.log(_json);

	for (i=0;i<_json.length;i++){

	    // console.log(_json[i].Year);
	    var d = new Date(_json[i].Year,_json[i].Month-1,_json[i].Day,_json[i].Hour,_json[i].Minute);

	    //console.log(d.getTime());
	    // data.push(JSON.parse(`{"T":"${d.getTime()}","L":"${_json[i].PPFD}"}`));
	    temp.push(JSON.parse(`{"T":"${d.getTime()}","L":"${_json[i].PPFD}"}`));



	}

	//console.log(temp);
	var chunk = 24;
	var count = 1;
	for (i=0;i<temp.length;i+=chunk){

	    data=temp.slice(i,i+chunk);


	    count++;

	    
	}
	callback(temp);

    }
    
    
};
