const fs = require("fs");
const csv = require("csvtojson");
const dateTo365 = require("./dateTo365.js");
module.exports={


    csvToJson(path, callback){

	var _path = ""+path;
	var stream = fs.createReadStream(path,"UTF-8");

	var body =[];
	
	csv({
	    toArrayString:true,
	    noheader:false,
	    headers:['Year','Month','Day','Hour','Minute','GHI']
	})
	.fromStream(stream)
	    .on("data",(csvRow)=>{
		const jsonStr = csvRow.toString('utf8');
		body.push(jsonStr);
	    })
	    .on("end",()=>{
		var _json = JSON.parse(JSON.stringify(body));
		callback(_path,_json);
	    })
	    .on("error",(err)=>{
		console.log(err);
		csvReadStream.unpipe();
	    });
    },
    storeIncomingSensorData(_data){
	var data=JSON.parse(_data);
	
	console.log(JSON.stringify(_data));
	    
	
	
    }


    
};

