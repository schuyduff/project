var fs = require("fs");
module.exports = {
    DLI(json, callback){

    var data = json;
	var DLI = [];
	var scalefactor = 1;
	var _DLI = data[0].PPFD*1800/1000000*scalefactor;

    for (i=1;i<data.length;i++){

	
	if (i==data.length-1){
	   
//	    DLI.push(JSON.parse(`{"Month":${data[i].Month},"Day365":${data[i-1].Day365},"DLI":${_DLI}}`));
	    _DLI=0;
	} else if(data[i].Month === data[i-1].Month && data[i].Day === data[i-1].Day){
	    
	    _DLI+= data[i].PPFD*1800/1000000*scalefactor;
	} else {
	    
	DLI.push(JSON.parse(`{"Month":${data[i].Month},"Day365":${data[i-1].Day365},"DLI":${_DLI}}`));

	   
	   
	    _DLI=data[i].PPFD;
//	    console.log(_DLI);
	}
    }

    callback(DLI);

    },

    GHI_to_PPFD(GHI){
	var temp = GHI * 4.6*100;
	Math.floor(temp);
	temp/=100;
	return temp;

    },

    GHI_to_PPFD_wrapper(_json,callback){

	var data = _json;
	for (i=0;i<data.length;i++){
	    
	    data[i].PPFD = this.GHI_to_PPFD(data[i].GHI);
//	    console.log(data[i].PPFD);
	}
	
	callback(data);
    },
    PPFD_Day365_only_hourly(_json,callback){

	var data = [];
	var temp = [];
//	console.log(_json);
	
	for (i=0;i<_json.length;i++){

	   // console.log(_json[i].Year);
	    var d = new Date(_json[i].Year,_json[i].Month-1,_json[i].Day,_json[i].Hour,_json[i].Minute);

	    //console.log(d.getTime());
	    // data.push(JSON.parse(`{"T":"${d.getTime()}","L":"${_json[i].PPFD}"}`));
	    temp.push(JSON.parse(`{"T":"${d.getTime()}","L":"${_json[i].PPFD}"}`));
	
	    
	    /*
	    if(_json[i].Hour==23 && _json[i].Minute==30 ){
		fs.writeFileSync("./public/assets/"+_json[i].Year+"_"+_json[i].Month+"_"+_json[i].Day+"_"+"2.json", JSON.stringify(temp));
//		console.log("wrote "+_json[i].Year+"_"+_json[i].Month+"_"+_json[i].Day+"_"+"2.json");
		temp =[];
	    } else if (_json[i].Hour == 11 && _json[i].Minute==30){
		fs.writeFileSync("./public/assets/"+_json[i].Year+"_"+_json[i].Month+"_"+_json[i].Day+"_"+"1.json", JSON.stringify(temp));
//		    console.log("wrote "+_json[i].Year+"_"+_json[i].Month+"_"+_json[i].Day+"_"+"1.json");
		temp =[];
	    }*/
	}

	console.log(temp);
	var chunk = 24;
	var count = 1;
	for (i=0;i<temp.length;i+=chunk){
	    
	    data=temp.slice(i,i+chunk);
	   
	    fs.writeFileSync("./public/assets/"+_json[i].Year+"_"+_json[i].Month+"_"+_json[i].Day+"_"+(count%2)+".json", JSON.stringify(data));
	    console.log("./public/assets/"+_json[i].Year+"_"+_json[i].Month+"_"+_json[i].Day+"_"+(count%2)+".json");
	    count++;






	}
	callback(temp);
	
    },
    LinearHours(_json,callback){


	//      console.log(_json);
	for (i=0;i<_json.length;i++){
	    
	    if (_json[i].Minute == 30){
		_json[i].LinearHours = _json[i].Hour + 0.5;
	    } else {
		_json[i].LinearHours = _json[i].Hour;
	    }
	    
	}

	callback(_json);

    },
    
    
};
