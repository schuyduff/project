var $ = require("jquery");
var d3 = require("d3");
var scatterplot = require("./lib/scatterplot.js");
var scatterplot2 = require("./lib/scatterplot2.js");
var io = require('socket.io');

$(document).ready(function(){

    scatterplot2.daily_PPFD("20150103");
   // scatterplot.annual_DLI("./assets/2015.json");
    $('#_date_').submit(function(event){
	


	var input = $("input").val().replace(/-/gi,"");
	console.log(input);
	scatterplot2.daily_PPFD(input);
	event.preventDefault();
    });
/*
    document.forms[0].onsubmit= function(){
	var input = document.getElementById('_date_').value;
	console.log(input);
    
    };*/

    //    sensor_socket();
});
