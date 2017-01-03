var $ = require("jquery");
var d3 = require("d3");
var scatterplot = require("./lib/scatterplot.js");
var io = require('socket.io');

$(document).ready(function(){

    scatterplot("./assets/2015.json");
//    sensor_socket();
});
