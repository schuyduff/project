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
/*
    storeIncomingSensorData(_data,res,callback){
//	console.log(_data);
	var data=JSON.parse(_data || null );
//	console.log(data);
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
	   
	   
		if (data[i].Minute == 30){
		    data[i].Hour24 = data[i].Hour + ".5";
		} else {
		    data[i].Hour24 = data[i].Hour;
		}
	  // console.log(data);
	    mkdirp.sync("./public/assets/logfiles/"+data[i].Year+"/"+data[i].Month+"/"+data[i].Day+"/");
	    
	    if (!fs.existsSync("./public/assets/logfiles/"+data[i].Year+"/"+data[i].Month+"/"+data[i].Day+"/"+data[i].Year+"_"+data[i].Month+"_"+data[i].Day+"_"+data[i].Hour+"_"+data[i].Minute+"_"+data[i].Second+".json")){

		
	//	console.log(data[i]);
		fs.writeFileSync("./public/assets/logfiles/"+data[i].Year+"/"+data[i].Month+"/"+data[i].Day+"/"+data[i].Year+"_"+data[i].Month+"_"+data[i].Day+"_"+data[i].Hour+"_"+data[i].Minute+"_"+data[i].Second+".json", JSON.stringify(data[i]));

		if (!fs.existsSync("./public/assets/logfiles/"+data[i].Year+"/"+data[i].Month+"/"+data[i].Day+"/"+"filenames.txt")){
		    fs.writeFileSync("./public/assets/logfiles/"+data[i].Year+"/"+data[i].Month+"/"+data[i].Day+"/"+"filenames.txt",
				     data[i].Year+"_"+data[i].Month+"_"+data[i].Day+"_"+data[i].Hour+"_"+data[i].Minute+"_"+data[i].Second+".json\n"
				    );
		} else {
		    
		    fs.appendFileSync("./public/assets/logfiles/"+data[i].Year+"/"+data[i].Month+"/"+data[i].Day+"/"+"filenames.txt",
				  data[i].Year+"_"+data[i].Month+"_"+data[i].Day+"_"+data[i].Hour+"_"+data[i].Minute+"_"+data[i].Second+".json\n"
				 );
		}
		
	    }
	    
	}
	callback(data,res);

	
    },
*/
    datalogger(data){

	

	
	

	for(i=0;i<data.length;i++){
	    this.edit(data[i]);
	}
	
	console.log("incoming data length: "+data.length);
	console.log(data[0]);
	var year = data[0].Year;
	var filepath = "./public/assets/datalogger/";

	mkdirp.sync(filepath);
	
//	console.log(data);
	// if a file with a matching year does not exist, then create new file and write data

	if (!fs.existsSync(filepath+year+".json")){
	    
	    fs.writeFileSync(filepath+year+".json",JSON.stringify(data));
 
	}
	//else append data if years match
	else {
	    
	    var log = JSON.parse(fs.readFileSync(filepath+year+".json","utf8"));
	    
	    var temp = log.concat(data);
	    var temp_sort = temp.sort(function(a,b){
		return a.T - b.T;
	    });

	    var results = [];
	    
	    for ( i = 0; i<temp.length-1;i++){	
	
		if(temp_sort[i+1].T != temp_sort[i].T){
		    results.push(temp_sort[i]);
		    
		}

		if (i==temp.length-2){
		    results.push(temp_sort[i+1]);
		}

	    }
	    
	    fs.writeFile(filepath+year+".json",JSON.stringify(results));
	    
	}


	
    },
    
    edit(item){

	var unix_timestamp = item.T;
	var t = new Date(unix_timestamp*1000);
	
	item.Year = t.getFullYear();
	item.Month = ("0" + t.getMonth()).slice(-2);

	//data[i].Month = 1;
	item.Day = ("0"+t.getDate()).slice(-2);
	item.Hour = ("0"+t.getHours()).slice(-2);
	
	item.Minute = ("0"+t.getMinutes()).slice(-2);
//	item.Second = ("0"+t.getSeconds()).slice(-2);
	item.Day365 = dateTo365.mathOnly(item.Year,item.Month,item.Day);
	
	if (item.Minute == 30){
	    item.Hour24 = item.Hour + ".5";
	} else {
	    item.Hour24 = item.Hour;
	}

	
    },

    findMissingDays(log){

	var days =[];
	var missing = [];
	for (i=0;i<log.length;i++){
	    
	   
	    date = dateTo365.mathOnly(log[i].Year,log[i].Month,log[i].Day);
	    if(!days.includes(date)){
		days.push(date);
	    }
	}
	
	//console.log(days);
	
	for (i=1;i<366;i++){
	    if(!days.includes(i)){
		missing.push(i);
	    }
	    
	}
	//console.log(days);
	console.log(missing);
    }


   

    
};

