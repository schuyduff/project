
module.exports ={

    wrapper(json,callback){

    var data = json;

	for (i=0;i<data.length;i++){
//	    console.log(data[i].Month-1);    
	    var _day = this.mathOnly(data[i].Year,data[i].Month-1,data[i].Day);
	    
	    _day = ("00"+_day).slice(-3);

	    data[i].Day365 = `${_day}`;
	
    }

    callback(data);
    
},
    mathOnly(year,month,_day){

	var now = new Date(year,month,_day);
	var start = new Date(now.getFullYear(), 0, 0);
	var diff = Math.abs(now - start);
	var oneDay = 1000 * 60 * 60 * 24;
	var day = Math.floor(diff / oneDay);
	return day;
			  }


};