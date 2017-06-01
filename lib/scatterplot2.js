var $ = require("jquery");
var d3 = require("d3");
var scatterplot2 = require("./scatterplot2.js");
var compute = require("./compute.js");
var dateTo365 = require("./dateTo365.js");
var formatting = require('./formatting.js');
module.exports = {
    
    JSONfilenames (_date,_year,_month,_day,x,y,DLI,CB) {
	var __day = ("0" + _day).slice(-2);
	//console.log(__day);
	var __month = ("0"+_month).slice(-2);
//	console.log(_month);
//	console.log(_date);
	var filepath2 = "./assets/logfiles/"+_year+"/"+__month+"/"+__day+"/";
	var filepath3 = "./assets/logfiles/"+_year+"/"+__month+"/"+__day+"/filenames.txt";
	//console.log(filepath3);
	var filenames = [];

	$.ajax({
	    type: "GET",
	    url: filepath3,
	    success:function(_data){

		filenames = _data.split(/\r\n|\n/);
		filenames.pop();
		CB(filenames,filepath2,x,y,DLI);
	
		
	    }

	});
	
    },
    forEach_CB(){
	console.log("ran");
    },
    filenames_CB(_filenames,filepath2,x,y,DLI){
	var new_data = [];
	var _forEach_CB = this.forEach_CB;
	var itemsProcessed = 0;

	_filenames.forEach(function(file,index,array){
	    
	    d3.json(""+filepath2+file).get(function(error,_json){

		itemsProcessed++;
		if(itemsProcessed === array.length) {


		   



		    var margin = {top: 100, right: 20, bottom: 80, left: 50},
			width = 960 - margin.left - margin.right,
			height = 600 - margin.top - margin.bottom;

//		    var x = d3.scaleLinear().range([0, width]);
//		    var y = d3.scaleLinear().range([height, 0]);

		    var _svg = d3.select("svg").append('svg:g').attr("class","dataset2")
		        .attr("width", width + margin.left + margin.right)
		        .attr("height", height + margin.top + margin.bottom)
		        .attr("transform",
			      "translate(" + margin.left + "," + margin.top + ")");

		    // Scale the range of the data
		    x.domain([0, d3.max(new_data, function(d) { return d.Hour24; })]);
		    y.domain([0, d3.max(new_data, function(d) { return d.L; })]);
		    // Add the X Axis
		    _svg.append("g")
		        .attr("transform", "translate(0," + height + ")")
		        .call(d3.axisBottom(x));

		    // Add the Y Axis
		    _svg.append("g")
		        .call(d3.axisLeft(y));
		    // text label for the x axis
		   _svg.append("text")
		        .attr("transform",
			      "translate(" + (width/2) + " ," +
			      (height + 40) + ")")
		        .style("text-anchor", "middle")
		        .text("Hour of the Day (0 - 23:30)");

		   _svg.append("text")
		        .attr("transform", "rotate(-90)")
		        .attr("y", 0 - margin.left)
		        .attr("x",0 - (height / 2))
		        .attr("dy", "1em")
		        .style("text-anchor", "middle")
		        .text("PPFD (\u03BC mol/m\u00B2/s)");
		    //=============================================================add circles
                   
		    d3.select('.dataset2').selectAll('.red')
		        .data(new_data)
		        .enter().append("svg:circle")
			.attr("class","red") 
		        .attr("r", 5)
		        .attr("cx", function(d) { return x(d.Hour24); })
		        .attr("cy", function(d) { return y(d.L); })
		        .style("fill","red");

		    var circles = d3.select(".dataset1").selectAll("circle");
		    
		   // console.log(circles);
		    
		    circles.data(DLI)
			.transition()
			.attr("cx", function(d) { return x(d.LinearHours); })
			.attr("cy", function(d) { return y(d.PPFD); });
			
		    circles
			.property("__oldData__",function(d){return d;})
			.data(new_data)
			.style("fill",function(d){
			   

			    if (this.__oldData__){
				

				var dif = d.L - this.__oldData__.PPFD;
			
//				console.log(dif);
				return (Math.abs(dif)>200) ? "transparent" : "black";

			    }

			});

		    circles = d3.select(".dataset2").selectAll("circle");
		    console.log(circles);
		    circles
		        .property("__oldData__",function(d){return d;})
		        .data(DLI)
		        .style("fill",function(d){


			    if (this.__oldData__){


				var dif = d.PPFD - this.__oldData__.L;

				console.log(Math.abs(dif));
                                return (Math.abs(dif)<200) ? "transparent" : "red";

			    }

			});





		    
		}
			_json.Hour24 = +_json.Hour24;
		_json.L = +_json.L;
		new_data.push(_json);	
	    });
	   
	});
//	console.log(new_data);
/*
	
	var margin = {top: 100, right: 20, bottom: 80, left: 50},
	    width = 960 - margin.left - margin.right,
	    height = 600 - margin.top - margin.bottom;

	var x = d3.scaleLinear().range([0, width]);
	var y = d3.scaleLinear().range([height, 0]);
	
	var _svg = d3.select("svg").append('svg:g').attr("class","dataset2")
            .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .attr("transform",
		  "translate(" + margin.left + "," + margin.top + ")");

	//console.log(_svg);
	// Add the X Axis
	_svg.append("g")
	    .attr("transform", "translate(0," + height + ")")
	    .call(d3.axisBottom(x));
	// Add the Y Axis
	_svg.append("g")
	    .call(d3.axisLeft(y));
	
	_svg.select('circle')
	    .data(new_data)
	    .enter().append("circle")
	    
	    .attr("r", 5)
	    .attr("cx", function(d) { return x(d.Hour24); })
	    .attr("cy", function(d) { return y(d.L); })
	    .style("fill","red");


	//console.log(new_data);
	*/
    },
    
    
    daily_PPFD(date){

	var year = date.substring(0,4);
	var month = date.substring(4,6);
	var month_indexed = parseInt(month-1); 
	var day = date.substring(6,8);
	year =  parseInt(year);
	month = parseInt(month);
	day = parseInt(day);
	console.log(year);
	console.log(month);
	console.log(day);
	
	var margin = {top: 100, right: 20, bottom: 80, left: 50};
	var width = 960 - margin.left - margin.right;
	var  height = 600 - margin.top - margin.bottom;

	//scale the ranges
	var x = d3.scaleLinear().range([0, width]);
	var y = d3.scaleLinear().range([height, 0]);

    
	// append the svg obgect to the body of the page


	var svg = d3.select("#_scatterplot_").insert("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
	// appends a 'group' element to 'svg'
	// moves the 'group' element to the top left margin
	    .append("svg:g")
	    .attr("class","dataset1")
	    .attr("transform",
		  "translate(" + margin.left + "," + margin.top + ")");

      	var filepath = "./assets/"+ year+"_PPFD_half_hourly.json";

	
	var _JSONfilenames = this.JSONfilenames;
	var _callback = this.filenames_CB;
	//=========================================================================load data
	d3.json(filepath).get(function(error,_json){
	    var input = _json;
//	    console.log(_json);
	    var DLI=[];
	    for (i=0;i<input.length;i++){

		if (input[i].Year == year && input[i].Month == month && input[i].Day == day){
		    DLI.push(input[i]);
		}
	    }
	   // console.log(DLI);
	    
	    DLI.forEach(function(d) {
		d.Day365 = +d.Day365;
		d.DLI = +d.DLI;
		
	    });
	    
	    // Scale the range of the data
	    x.domain([0, d3.max(DLI, function(d) { return d.LinearHours; })]);
	    y.domain([0, d3.max(DLI, function(d) { return d.PPFD; })]);
/*

	    // Add the X Axis
	    svg.append("g")
	        .attr("transform", "translate(0," + height + ")")
	        .call(d3.axisBottom(x));

	    // Add the Y Axis
	    svg.append("g")
	        .call(d3.axisLeft(y));
/*
	    // text label for the x axis
	    svg.append("text")
	        .attr("transform",
		      "translate(" + (width/2) + " ," +
		      (height + 40) + ")")
	        .style("text-anchor", "middle")
	        .text("Hour of the Day (0 - 23:30)");
	    
	    svg.append("text")
	        .attr("transform", "rotate(-90)")
	        .attr("y", 0 - margin.left)
	        .attr("x",0 - (height / 2))
	        .attr("dy", "1em")
	        .style("text-anchor", "middle")
	        .text("PPFD (\u03BC mol/m\u00B2/s)");
*/	    
	    var refreshGraph = function(){
		
	    // Add the scatterplot
		svg.selectAll('circle')
		.data(DLI)
		.enter().append("circle")
		    .attr("class","black")
		    .attr("r", 5)
		.attr("cx", function(d) { return x(d.LinearHours); })
		.attr("cy", function(d) { return y(d.PPFD); })
		.style("fill","black");
	    };

	  //  d3.selectAll(".add-data")
	//	.on("click", function() {
	
		    var _filenames = _JSONfilenames(date,year,month_indexed,day,x,y,DLI,_callback);

	
			   // data.push(obj);
		   // refreshGraph();
	//	});

	    refreshGraph();
	    
	
	});
/*	//=================================================================================construct JSON file



	
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
	    .text("PPFD (mol/m^2/s)");     
*/	
    }

    
};
