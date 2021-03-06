var $ = require("jquery");
var d3 = require("d3");

var compute = require("./compute.js");
var dateTo365 = require("./dateTo365.js");
var formatting = require('./formatting.js');

module.exports = {

    annual_DLI(json){
/*
    var margin = {top: 100, right: 20, bottom: 80, left: 50},
	width = 960 - margin.left - margin.right,
	height = 600 - margin.top - margin.bottom;

    //scale the ranges
	var x = d3.scaleLinear().range([0, width]);
	var y = d3.scaleLinear().range([height, 0]);

    
    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
	var svg = d3.select("div#_svg_1").append("svg")
	    .attr("viewBox", "0 0 "+ width+" "+(width/2) +"")
	    .attr("preserveAspectRatio", "xMinYMin meet")
	.append("g")
        .attr("transform",
	      "translate(" + margin.left + "," + margin.top + ")");
*/


	var height = $('#_svg_1').outerHeight();

	var width = $('#_svg_1').outerWidth();
	
	var svg = d3.select("div#_svg_1").append("svg")

	    .attr("viewBox", "0 0 "+ width+" "+(width/2) +"")
	    .attr("preserveAspectRatio", "xMinYMin meet")


	    .classed("_svg_content_", true);


        var margin = {
	    top_scale:0.06,
	    right_scale:0.1,
	    bottom_scale:0.6,
	    left_scale:0.07,
	    top:0,
	    right:0,
	    bottom:0,
	    left: 0
	};
	margin.top = margin.top_scale*height;
	margin.bottom = margin.bottom_scale*height;
	margin.left = margin.left_scale*width;
	margin.right = margin.right_scale*width;

	var size = {
	    'height':$('#_svg_').outerHeight() - margin.top - margin.bottom,
	    'width':$('#_svg_').outerHeight() - margin.right - margin.left
	};

	height = size.height;
	width = size.width;

	//scale the ranges
	var x = d3.scaleLinear().range([0, size.width]);
	var y = d3.scaleLinear().range([size.height, 0]);
	var z = d3.scaleOrdinal().range(["red","black"]);
	
	console.log(json);
//load data
    d3.json(json).get(function(error,_json){
	var input = _json;
	var DLI=[];
	for (i=0;i<input.length;i++){
	    DLI.push(input[i]);
	  	}
//	console.log(DLI);

	DLI.forEach(function(d) {
	    d.Day365 = +d.Day365;
	    d.DLI = +d.DLI;
	    
	});

//	console.log(d3.max(DLI, function(d){return d.DLI;}));	
	// Scale the range of the data
	x.domain([0, d3.max(DLI, function(d) { return d.Day365; })]);
	y.domain([0, d3.max(DLI, function(d) { return d.DLI; })]);

	/*
	// Add the scatterplot
	svg.selectAll("dot")
	    .data(DLI)
	    .enter().append("circle")
	    .attr("r", 5)
	    .attr("cx", function(d) { return x(d.Day365); })
	    .attr("cy", function(d) { return y(d.DLI); });
*/


	// Add the X Axis
	svg.append("g")
	    .attr("transform", "translate(0," + height + ")")
	    .call(d3.axisBottom(x));

	// Add the Y Axis
	svg.append("g")
	    .call(d3.axisLeft(y));
    });
	
    },

    daily_PPFD(date){

	var year = date.substring(0,4);
	var month = date.substring(4,6);
	var day = date.substring(6,8);
	year =  parseInt(year);
	month = parseInt(month);

	day = parseInt(day);
	console.log(year);
	console.log(month);
	console.log(day);
	
	var margin = {top: 100, right: 20, bottom: 80, left: 50},
	    width = 960 - margin.left - margin.right,
	    height = 600 - margin.top - margin.bottom;

	//scale the ranges
	var x = d3.scaleLinear().range([0, width]);
	var y = d3.scaleLinear().range([height, 0]);

    
	// append the svg obgect to the body of the page
	// appends a 'group' element to 'svg'
	// moves the 'group' element to the top left margin
	var svg = d3.select("body").insert("svg",":nth-child(4)")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
	    .append("svg:g")
            .attr("transform",
		  "translate(" + margin.left + "," + margin.top + ")");

	var filepath = "./assets/"+year+"_PPFD_half_hourly.json";
	//=========================================================================load data
	d3.json(filepath).get(function(error,_json){
	    var input = _json;
	    var DLI=[];
	    for (i=0;i<input.length;i++){

		if (input[i].Year == year && input[i].Month == month && input[i].Day == day){
		    DLI.push(input[i]);
		}
	    }
	  //  console.log(DLI);
	    
	    DLI.forEach(function(d) {
		d.Day365 = +d.Day365;
		d.DLI = +d.DLI;
		
	    });
	    
	    // Scale the range of the data
	    x.domain([0, d3.max(DLI, function(d) { return d.LinearHours; })]);
	    y.domain([0, d3.max(DLI, function(d) { return d.PPFD; })]);
	    
	    
	    // Add the scatterplot
	    svg.selectAll()
		.data(DLI)
		.enter().append("circle")
		.attr("r", 5)
		.attr("cx", function(d) { return x(d.LinearHours); })
		.attr("cy", function(d) { return y(d.PPFD); })
		.style("fill","black");
	    
	    
	    // Add the X Axis
	    svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));
	    
	    // Add the Y Axis
	    svg.append("g")
		.call(d3.axisLeft(y));
	    
	    // text label for the x axis
	    svg.append("text")
		.attr("transform",
		      "translate(" + (width/2) + " ," +
		      (height + 40) + ")")
		.style("text-anchor", "middle")
		.text("Hour of the Day (0 - 23:30)");
	});
	//=================================================================================construct JSON file



	
	var filepath2 = "./assets/logfiles/"+year+"/"+date.substring(4,6)+"/"+day+"/";
	var filepath3 = "./assets/logfiles/"+year+"/"+date.substring(4,6)+"/"+day+"/filenames.txt";
//	console.log(filepath3);
	var filenames= [];
	$.ajax({
	    //type: "GET",
	    url: filepath3,
	    success:function(data){

		filenames = data.split(/\r\n|\n/);
		filenames.pop();
		//console.log(filenames);	

		filenames.forEach(function(file,i){

		   
	//=========================================================================load data 2
	d3.json(""+filepath2+file).get(function(error,_json){
	    var input = _json;
	  // console.log(input);
	    // console.log(i);
//	    var DLI=_json;
/*	    for (i=0;i<input.length;i++){

		if (input[i].Year == year && input[i].Month == month && input[i].Day == day){
		    DLI.push(input[i]);
		}
	    }
	    console.log(DLI);

	    DLI.forEach(function(d) {
		d.Day365 = +d.Day365;
		d.DLI = +d.DLI;

	    });
*/
	   input.Hour24 = +input.Hour24;
	   input.L = +input.L;
	   console.log(input.L);
	   console.log(input.Hour24);
	    // Scale the range of the data
	  //  x.domain([0, d3.max(input, function(d) { return d.Hour24; })]);
	   // y.domain([0, d3.max(input, function(d) { return d.L; })]);
	//    x.domain([0, 23]);
	 //   y.domain([0, 2400]);
	    // Add the scatterplot
	    svg.selectAll("circle")
	        .data(input)
	        .enter().append("svg:circle")
		.attr("r", 5)
	        .attr("cx",x(input.Hour24))
	        .attr("cy",y(input.L))
		.style("fill","red");
	});


		});


	//=====================================================================================end ajax request
    }

});
       	// text label for the y axis
	svg.append("text")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 - margin.left)
	    .attr("x",0 - (height / 2))
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
	    .text("DLI (mol/m\u00B2/d)");     
	
    }

    
};
