const fs = require("fs");
const csv = require("csvtojson");

module.exports={


    csvToJson(path, callback){

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
		callback(body);
	    })
	    .on("error",(err)=>{
		console.log(err);
		csvReadStream.unpipe();
	    });
    }

};

