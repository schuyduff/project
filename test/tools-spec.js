var expect = require("chai").expect;
var tools = require("../lib/tools");

describe("Tools",()=>{

    describe("csvToJson()",()=>{

	it("should load a csvfile",(done)=>{

	     tools.csvToJson("./assets/2015.csv",(csvfile)=>{
		 
		 expect(csvfile).to.be.equal("./assets/2015.csv");
		 done();
	     });
	});

    });

});
