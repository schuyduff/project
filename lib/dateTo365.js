
module.exports = function dateTo365(json,callback){

    var data = json;

    for (i=0;i<data.length;i++){

	var now = new Date(data[i].Year,data[i].Month-1,data[i].Day);
	var start = new Date(now.getFullYear(), 0, 0);
	var diff = Math.abs(now - start);
	var oneDay = 1000 * 60 * 60 * 24;
	var day = Math.floor(diff / oneDay);
	//console.log(day);
	data[i].Day365 = `${day}`;
	
    }
  
    callback(data);
    
};
