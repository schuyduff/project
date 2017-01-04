const fs = require("fs");
const csv = require("csvtojson");
const dateTo365 = require("./dateTo365.js");
var mkdirp = require("mkdirp");
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

    storeIncomingSensorData(_data,res,callback){
	var data=JSON.parse(_data);

    console.log("\n");
 
	for (i=0;i<data.length;i++){
	    var unix_timestamp = data[i].T;
	    
	    var t = new Date(unix_timestamp*1000);
	    data[i].Year = t.getFullYear();
	    data[i].Month = ("0" + t.getMonth()).slice(-2);

	    //data[i].Month = 1;
	    data[i].Day = ("0"+t.getDate()).slice(-2);
	    data[i].Hour = ("0"+t.getHours()).slice(-2);
	    data[i].Minute = ("0"+t.getMinutes()).slice(-2);
	    data[i].Second = ("0"+t.getSeconds()).slice(-2);

	
	    
	    mkdirp("./public/assets/logfiles/"+data[i].Year+"/"+data[i].Month+"/"+data[i].Day+"/");

	    if (!fs.existsSync("./public/assets/logfiles/"+data[i].Year+"/"+data[i].Month+"/"+data[i].Day+"/"+data[i].Day+"_"+data[i].Hour+"_"+data[i].Minute+"_"+data[i].Second+".json")){

	
		
		fs.writeFileSync("./public/assets/logfiles/"+data[i].Year+"/"+data[i].Month+"/"+data[i].Day+"/"+data[i].Year+"_"+data[i].Month+"_"+data[i].Day+"_"+data[i].Hour+"_"+data[i].Minute+"_"+data[i].Second+".json", data[i]);
		
	    }
	    
	}
	callback(data,res);

	
    }


   

    
};

