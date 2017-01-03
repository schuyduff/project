var date = require("./dateTo365.js");
var compute = require("./compute.js");
module.exports={

    parseJSON(json,callback){

	var input = json;
	var data = [];
	for(i=5;i<input.length;i+=2){
	    data.push(JSON.parse(input[i]));
	    
	}

	date.wrapper(data,function(_data){
	    data = _data;

	    //   console.log(data);
	    callback(data);
	});

    } 



};
