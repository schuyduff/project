var $ = require("jquery");
var d3 = require("d3");
var bootstrap = require("./less/bootstrap/dist/js/bootstrap.js");
var scatterplot6 = require("./lib/scatterplot6.js");
var io = require('socket.io');
var form = require("./lib/form.js");

$(document).ready(function(){

    form.date();
    scatterplot6.main();

    
   // scatterplot5.daily("20150101");
    //scatterplot4.annual_DLI("./assets/2015_PPFD_Day365_hourly.json");
    
   // scatterplot5.PPFD_daily_new("20150103");
    
    
    
    /*
    $('#_date_').submit(function(event){

	var year = $('input[name=year]:checked').val();
	var month =('0'+$('input[name=month]:checked').val()).slice(-2);
	var day =  ('0'+$('input[name=day]:checked').val()).slice(-2);
	var input = ""+year+month+day;

	scatterplot3.JSONfilenames(input, function(filenames){
	    scatterplot3.PPFD_daily_new(input,filenames);

	});
	
	
	
	event.preventDefault();

	
    });
    */
    

/*
    document.forms[0].onsubmit= function(){
	var input = document.getElementById('_date_').value;
	console.log(input);
    
    };*/

    //    sensor_socket();
});
