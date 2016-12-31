var $ = require("jquery");
var d3 = require("d3");
var scatterplot = require("./lib/scatterplot.js");
var computeDLI = require("./lib/computeDLI.js");


$(document).ready(function(){

    scatterplot("./assets/2015.json");
    
});
