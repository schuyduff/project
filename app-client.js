var $ = require("jquery");
var d3 = require("d3");
var bootstrap = require("./less/bootstrap/dist/js/bootstrap.js");
var draw = require("./server/util/draw.js");
var stream = require("./server/util/stream.js");
var io = require('socket.io-client');
var form = require("./server/util/form.js");
//var visibility = require('visibilityjs');

$(document).ready(function(){


    
    //=======================================================initialize html
   
    form.date();

    //====================================================================while loading
    var targets = ['#stream-graph'];

    function whileLoad(){

	draw.targets(targets).map(function(target){

	    return draw.animation(target);

	}).then((elem)=>{
	    console.log("Loading Animation Done!");
	    		console.log(elem);
	}).catch((e)=>{
	    console.log("--------------------------------Error!");
	    console.log(e);
	    
	});
	
	
    } whileLoad(targets);

    
    //=========================================================Draw scatterplots
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
		console.log("Done Drawing Scatterplots!");
//		console.log(elem);
	    }).catch((e)=>{
		console.log("--------------------------------Error!");
		console.log(e);
		
	    });
	
    }

    $('#selectYear').on('input',(event)=>{

	var file1 = event.currentTarget.value;
	var file2 = file1+"_rules";
	main([file1,file2]);

    }); main({

	file1:"2015",
	file2:"2015_rules"
    });

    
//==============================================================draw stream graph
    function streamGraph(queries){
/*
	stream.query(queries).each(function(request){
	    
	    return draw.load(request)
		.then((data)=>{
		    
		    stream.draw(data,'#stream-graph');
		    
		})
	//	.then(stream.yesterday)
	//	.then(stream.today)
	    
		.then((elem)=>{
		    //console.log("Done Drawing Stream!");
		    console.log(elem);
		}).catch((e)=>{
		    console.log("--------------------------------Error!");
		    console.log(e);
		    
		});
	    
	}).then((elem)=>{
	    console.log("Done Drawing Stream!");
	    console.log(elem);
	}).catch((e)=>{
	    console.log("--------------------------------Error!");
	    console.log(e);
	    
		});
*/	
	

	stream.query(queries).map(function(request){
	    
	    return draw.load(request);
	    
	},{concurrency:3})
	
	    .then(stream.draw)	
	    .then(stream.yesterday)
	    .then(stream.today)
	
	    .then((elem)=>{
		console.log("Done Drawing Stream!");
		console.log(elem);
	    }).catch((e)=>{
		console.log("--------------------------------Error!");
		console.log(e);
		
	    });

	
	
    } streamGraph({

	lookback:'lookback/5000',
	yesterday:'yesterday',
	today:'today'

    });



    $('.splash-enter').on('click',function(){
	$(document).scrollTop(0);
	$('.splash').fadeOut();

    });

    $('.nav-abstract').on('click',function(){
	$('.splash-one').fadeIn();
    });
    
    $('.splash-enter').on('click',function(){
	$(document).scrollTop(0);
	$('.splash').fadeOut();
	
    });
    
    $('.nav-contact').on('click',function(){
	$('.splash-two').fadeIn();
	
    });
    
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
