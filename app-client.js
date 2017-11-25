var $ = require("jquery");
var d3 = require("d3");
var bootstrap = require("./less/bootstrap/dist/js/bootstrap.js");
var draw = require("./server/util/draw.js");
var streamGraph = require("./server/util/streamGraph.js");
var io = require('socket.io-client');
var form = require("./server/util/form.js");
//var visibility = require('visibilityjs');

$(document).ready(function(){


    
    
    form.date();
    
    function main(fileNames){

	draw.query(fileNames)
	    .map(function(fileName){

		return draw.load(fileName);
			
	    },{concurrency:1})
	
	    .then(draw.annual)
	    .then(draw.daily)
	    .then(draw.annualLassi)
	    .then(draw.dailyLassi)
	    .then(draw.radarPlot)
	    .then((elem)=>{
		console.log("Done Drawing!");
		console.log(elem);
	    }).catch((e)=>{
		console.log("--------------------------------Error!");
		console.log(e);
		
	    });
	
    }

    $('#selectYear').on('input',(event)=>{

	var file1 = event.currentTarget.value;
	var file2 = file1+"_rules";
	main([file1,file2]);

    }); main(["2015","2015_rules"]);


    function liveStream(fileName){


    } liveStream([""]);

    


    //scatterplot7.main();
    
    

  //  console.log(visibility.state());
    

//    streamGraph.main();










    /*
    var host = location.origin.replace(/^http/,"ws");
    
    var ws = new WebSocket(host+"/web");

    
    ws.onopen = function(){
	console.log("Websocket Connected!");
    };

    
    ws.onmessage = function(payload){

	console.log(payload);
	
    };
    */
    
/*    
    var id = setInterval(function(){
	ws.send("d");
	
    },1000);
*/
    
});
