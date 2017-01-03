
module.exports ={

    dateTo365(json,callback){

    var data = json;

    for (i=0;i<data.length;i++){
	var _day = dateTo365_mathOnly(data[i].Year,data[i].Month-1,data[i].Day);
	data[i].Day365 = `${_day}`;
	
    }
  
    callback(data);
    
},
    dateTo365_mathOnly(year,month,_day){

	var now = new Date(year,month-1,_day);
	var start = new Date(now.getFullYear(), 0, 0);
	var diff = Math.abs(now - start);
	var oneDay = 1000 * 60 * 60 * 24;
	var day = Math.floor(diff / oneDay);
			      return day;
			  }


};
