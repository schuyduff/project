var $ = require("jquery");
var d3 = require("d3");
var compute = require("./compute.js");
var dateTo365 = require("./dateTo365.js");
var formatting = require('./formatting.js');
module.exports = function scatterplot(json){

    var margin = {top: 100, right: 20, bottom: 30, left: 50},
	width = 960 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom;

    //scale the ranges
	var x = d3.scaleLinear().range([0, width]);
	var y = d3.scaleLinear().range([height, 0]);

    
    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
	.append("g")
        .attr("transform",
	      "translate(" + margin.left + "," + margin.top + ")");

//load data
    d3.json(json).get(function(error,_json){
	var DLI=[];
	formatting.parseJSON(_json, function(_data){
	    compute.GHI_to_PPFD_wrapper(_data, function(_data){
	    compute.DLI(_data,function(_data){

		DLI=_data;
		console.log(DLI);

	// format the data
	DLI.forEach(function(d) {
	    d.Day365 = +d.Day365;
	    d.DLI = +d.DLI;
	    
	});

	// Scale the range of the data
	x.domain([0, d3.max(DLI, function(d) { return d.Day365; })]);
	y.domain([0, d3.max(DLI, function(d) { return d.DLI; })]);

	
	// Add the scatterplot
	svg.selectAll("dot")
	    .data(DLI)
	    .enter().append("circle")
	    .attr("r", 5)
	    .attr("cx", function(d) { return x(d.Day365); })
	    .attr("cy", function(d) { return y(d.DLI); });



	// Add the X Axis
	svg.append("g")
	    .attr("transform", "translate(0," + height + ")")
	    .call(d3.axisBottom(x));

	// Add the Y Axis
	svg.append("g")
	    .call(d3.axisLeft(y));

	    });

	});
		
	});
    });

};
