var $ = require("jquery");
var d3 = require("d3");
var scatterplot2 = require("./scatterplot2.js");
var compute = require("./compute.js");
var dateTo365 = require("./dateTo365.js");
var formatting = require('./formatting.js');
var async = require("async");
var self = module.exports = {

    load(height,width, margin, input, x,y,svg,black_circles, red_circles, JSONfilenames, _callback){

	var date = this.date_process(input);

	var filepath = "./assets/"+ date.year+"_PPFD_half_hourly.json";
	var filepath2 = "./assets/logfiles/"+date.year+"/"+date._month_indexed+"/"+date._day+"/";

	var filenames = [];
	JSONfilenames(date, function(_filenames){
	    filenames= _filenames;
	

	
	d3.json(filepath).get(function(error,data1){
	    var data2 = [];

          
	    async.each(filenames, function(file,callback){

		d3.json(""+filepath2+file).get(function(error,item){


		    item.Hour24 = +item.Hour24;
		    item.L = +item.L;
		    data2.push(item);
		    callback();

		});
	    },
 
		function(callback){

		    _callback(data1, data2, height,width, margin, date,x,y,svg, black_circles, red_circles);
		   
		}

	    );
	   
	   	});
	});	
    },
    draw(data1,data2,height,width, margin,date,x,y,svg, black_circles, red_circles){

	black_circles.selectAll('circle').remove();
	red_circles.selectAll('circle').remove();
	svg.selectAll('.axis').remove();

	console.log(date);

      	    var _data1=[];


	    for (i=0;i<data1.length;i++){
		
		if (data1[i].Year == date.year && data1[i].Month == date.month && data1[i].Day == date.day){
		    _data1.push(data1[i]);
		}		
	    }
/*
	    for (i=0;i<_data1.length;i++){
		
		for (j=0;j<data2.length; j++){

		    if(data2[j].Hour24 == data1[i].LinearHours){
			
			_data1[i].R = data2[j].R;
			_data1[i].L = data2[j].L;

		    }

		}

	    }
*/
	console.log(_data1);
	console.log(data2);

	    _data1.forEach(function(d) {
		d.LinearHours = +d.LinearHours;
		d.PPFD = +d.PPFD;

	    });
	
	    // Scale the range of the data
	x.domain([0, d3.max(_data1, function(d) { return d.LinearHours; })]);
	y.domain([0, d3.max(_data1,
			    function(d){

				return Math.max(
				    d.PPFD, d3.max(data2,function(d){
					return d.L;
				    })
				);
			    })

		 ]);
	console.log("height at append: "+ height);
	console.log("margin at append: "+ margin.top);

            // Add the X Axis
	svg.append("g")
	.attr("class","axis")
	    .attr("transform", "translate("+(margin.left+10)+","+(height+margin.top)+")")
	   
	        .call(d3.axisBottom(x));

	// Add the Y Axis
	svg.append("g")
	    .attr("class","axis")
	        .attr("transform", "translate("+(margin.left+10)+","+margin.top+")")
	        .call(d3.axisLeft(y));



	// text label for the axes
	svg.append("text")
	.attr("class","axis")
	    .attr("transform","translate(" + ((width/2)+margin.left+10)+ " ," + (height + margin.top+40) + ")")
	        .style("text-anchor", "middle")
		.style("font-size", ".7em")
	        .text("Hour of the Day (0 - 23:30)");

	svg.append("text")
	.attr("class","axis")
	        .attr("transform", "rotate(-90)")
	        .attr("y", 0 + margin.left/50)
	        .attr("x",0 - (height / 2) - margin.top)
	        .attr("dy", "1em")
	        .style("text-anchor", "middle")
		.style("font-size", ".7em")
	        .text("PPFD (\u03BC mol/m\u00B2/s)");

	// Add the scatterplot   
	    black_circles.selectAll("circle")
	    .data(_data1)
	        .enter()
		.append("circle")
	        .attr("class","data1")
	        .attr("r", 5)
	        .attr("transform", "translate("+(margin.left+10)+","+margin.top+")")
	        .attr("cx", function(d) { return x(d.LinearHours); })
	        .attr("cy", function(d) { return y(d.PPFD); })
	        .style("fill","black");
				   	    
	    red_circles.selectAll("circle")
	        .data(data2)
	        .enter()
	        .append("circle")
	        .attr("class","data2")
	        .attr("r", 5)
	        .attr("transform", "translate("+(margin.left+10)+","+margin.top+")")
	        .attr("cx", function(d) { return x(d.Hour24); })
	        .attr("cy", function(d) { return y(d.L); })
	        .style("fill",

		       function(d){

			   return (d.R ===0) ? "red" : "transparent";

		       });
	    


		red_circles.exit().remove();
	
    },
    date_process(date){
	var _date = {
	    year: parseInt(date.substring(0,4)),
	    month: parseInt(date.substring(4,6)),
	    month_indexed: parseInt(parseInt(date.substring(4,6))-1),
	    day: parseInt(date.substring(6,8)),
	    _month_indexed: ("0"+parseInt(parseInt(date.substring(4,6))-1)).slice(-2),
	    _day: ("0"+date.substring(6,8)).slice(-2)

	};
	return _date;
    },
    PPFD_daily_new(input){
	
        var height = $('#_svg_').outerHeight();

	var width = $('#_svg_').outerWidth();

        var svg = d3.select("div#_svg_").append("svg")
	
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
	
	$(window).resize(function(){
	    size.height=parseInt($('#_svg_').outerHeight());
	    margin.top = parseInt(margin.top_scale*size.height);
	    margin.bottom = parseInt(margin.bottom_scale*size.height);
	    size.height -= (margin.top + margin.bottom);
	    height = size.height;
	    
            size.width=parseInt($('#_svg_').outerWidth());
	    margin.right = parseInt(margin.right_scale*size.width);
	    margin.left = parseInt(margin.left_scale*size.width);
	    size.width -= (margin.right + margin.left); 
	    width = size.width;

	   // console.log("height on resize: "+ height);
	   // console.log("margin on resize: "+margin.top);
	  //  console.log("width on resize: "+width);
	   
	    x.range([0,size.width]);
	    y.range([size.height,0]);
	
	});
	

        var black_circles = d3.select("svg").append('g').attr('class','black');
	var red_circles = d3.select('svg').append('g').attr('class','red');
	
	$('#_date_').submit(function(event){

            var year = $('input[name=year]:checked').val();
	    var month =('0'+$('input[name=month]:checked').val()).slice(-2);
	    var day =  ('0'+$('input[name=day]:checked').val()).slice(-2);
	    input = ""+year+month+day;
	    var test = self.date_process(input);


	    self.load(height,width, margin, input, x,y,svg,black_circles, red_circles, self.JSONfilenames, self.draw);
	    event.preventDefault();

	});
	
	this.load(height,width, margin, input, x,y,svg,black_circles, red_circles, this.JSONfilenames, this.draw);

	
    },

     
    JSONfilenames (date,cb) {

        var year = date.year;
	var month = date._month;
	var month_indexed = date._month_indexed;
	var day = date._day;
	
	
	
	var filepath3 = "./assets/logfiles/"+year+"/"+month_indexed+"/"+day+"/filenames.txt";

	var filenames = [];

	$.ajax({
	    type: "GET",
	    url: filepath3,
	    success:function(_data){

		filenames = _data.split(/\r\n|\n/);
		filenames.pop();
		cb(filenames);
		
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
