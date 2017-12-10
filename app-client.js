var $ = require("jquery");
var d3 = require("d3");
var bootstrap = require("./less/bootstrap/dist/js/bootstrap.js");
var draw = require("./server/util/draw.js");
var stream = require("./server/util/stream.js");
var io = require('socket.io-client');
var form = require("./server/util/form.js");
var viewport = require('responsive-toolkit');

$(document).ready(function(){
    //=======================================================initialize html
   
    form.date();
    //=============================================================================on resize

    $(window).resize(function () {
	$(window).trigger("window:resize");
    });


    if(viewport.is('xs')) {
	console.log('xs');

    }

    if(viewport.is('sm')) {
	console.log('sm');


    }

    if(viewport.is('md')) {
	console.log('md');

    }

    if(viewport.is('lg')) {
	console.log('lg');

    }
    
    //=========================================================================splash

    
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
    
    //====================================================================while loading

    var targets = ['.first'];

    function whileLoad(){

	draw.targets(targets).map(function(target){

	    return draw.animation(target);

	}).then((elem)=>{
	    console.log("Loading Animation Done!");
//	    		console.log(elem);
	}).catch((e)=>{
	    console.log("--------------------------------Error!");
	    console.log(e);
	    
	});
	
	
    } whileLoad(targets);

    var data;
    //=========================================================Draw scatterplots
    function main(fileNames){

	draw.query(fileNames)
	    .map(function(fileName){

		return draw.load(fileName);
			
	    },{concurrency:1})
//	    .then(draw.dashboardHistorical)
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

	file1:"2014",
	file2:"2014_rules"
    });

    
//==============================================================draw stream graph

    function streamGraph(queries){

	stream.query(queries).map(function(request){
	    
	    return draw.load(request);
	    
	},{concurrency:3})
	    .then(stream.dashboard)
	    .then(stream.draw)	
	    .then(stream.yesterday)
	    .then(stream.today)
	
	    .then((elem)=>{
		console.log("Done Drawing Stream!");

	    }).catch((e)=>{
		console.log("--------------------------------Error!");
		console.log(e);
		
	    });

	
	
    } streamGraph({

	lookback:'lookback/5000',
	yesterday:'yesterday',
	today:'today'

    });

});
