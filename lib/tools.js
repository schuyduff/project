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

    storeIncomingSensorData(_data,storage,callback){
    var data=JSON.parse(_data);
    console.log("\n");
 
 for (i=0;i<data.length;i++){
     var unix_timestamp = data[i].T;
    
	var t = new Date(unix_timestamp*1000);
     data[i].Year = t.getFullYear();
    // data[i].Month = t.getMonth();
     data[i].Month = 2;
	data[i].Day = t.getDate();
	data[i].Hour = t.getHours();
	data[i].Minute = t.getMinutes();
	data[i].Second = t.getSeconds();
//     console.log(data[i]);
     console.log(storage.length);
     if(storage.length<1 || typeof storage ==='undefined') {
	 storage.push(data[i]);

     }else if (data[i].Month===storage[storage.length-1].Month && data[i].Day===storage[storage.length-1].Day){
	 storage.push(data[i]);
	 console.log(storage[storage.length-1]);

     } else {
	 if (!fs.existsSync("./public/assets/logfiles/"+data[i].Year+"_"+data[i].Month+"_"+data[i].Day+".json")){
	     fs.writeFile("./public/assets/logfiles/"+data[i].Year+"_"+data[i].Month+"_"+data[i].Day+".json", JSON.stringify(storage),(err)=>{
		 console.log("./public/assets/logfiles/"+data[i].Year+"_"+data[i].Month+"_"+data[i].Day+".json file written");
	     });
	 } else if (fs.existsSync("./public/assets/logfiles/"+data[i].Year+"_"+data[i].Month+"_"+data[i].Day+".json")){
	     var obj = JSON.parse("./public/assets/logfiles/"+data[i].Year+"_"+data[i].Month+"_"+data[i].Day+".json");
	     obj.push(storage);
	     fs.writeFile("./public/assets/logfiles/"+data[i].Year+"_"+data[i].Month+"_"+data[i].Day+".json", JSON.stringify(obj),(err)=>{
		 console.log("./public/assets/logfiles/"+data[i].Year+"_"+data[i].Month+"_"+data[i].Day+".json file written");
	     });
	 }
	// console.log(storage);
	 storage = [];
	 storage.push(data[i]);
     }
     
 }

	callback(storage);
	
}


   

    
};

