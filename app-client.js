var $ = require("jquery");
var d3 = require("d3");
var scatterplot = require("./lib/scatterplot.js");
var io = require('socket.io');

$(document).ready(function(){

     scatterplot.annual_DLI("./assets/2015.json");
 //   scatterplot.daily_PPFD("./assets/2015_PPFD_half_hourly.json", "20150621");
//    sensor_socket();
});
