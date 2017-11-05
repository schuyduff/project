var $ = require("jquery");
var d3 = require("d3");

var compute = require("./compute.js");
var dateTo365 = require("./dateTo365.js");
var formatting = require('./formatting.js');
var async = require("async");
var self = module.exports = {

    
    load(height,width, margin, input, x,y,z,svg, filepath,date, JSONfilenames, _callback){




	var filepath2 = "./assets/logfiles/"+date.year+"/"+date._month_indexed+"/"+date._day+"/";

	var filenames = [];
	
	JSONfilenames(date, function(_filenames){
	    filenames= _filenames;
	

	
	d3.json(filepath).get(function(error,data1){
	    var data2 = [];
	    //console.log(data1);
          
	    async.each(filenames, function(file,callback){

		d3.json(""+filepath2+file).get(function(error,item){


		    item.Hour24 = +item.Hour24;
		    item.L = +item.L;
		    data2.push(item);
		    callback();

		});
	    },
 
		function(callback){

		    _callback(data1, data2, height,width, margin, date,x,y,z,svg);
		   
		}

	    );
	   
	   	});
	});	
    },




    draw(data1,data2,height,width, margin,date,x,y,z,svg){

	console.log(data2);
	
	svg.selectAll('.today').remove();
	svg.selectAll('.axis').remove();

      	    var _data1=[];


	    for (i=0;i<data1.length;i++){
		
		if (data1[i].Year == date.year && data1[i].Month == date.month && data1[i].Day == date.day){
		    _data1.push(data1[i]);
		}		
	    }

        var result = self.join(_data1,data2,"LinearHours","Hour24",function(item1, item2){


	    return {
		Hour24:item2.LinearHours,
		rule: item1.R,
		PPFD: (item1.R !== 0 ) ? 0 : Math.abs(item1.L - item2.PPFD),
		PPFD_old: item2.PPFD

	    };

	});

	result.forEach(function(d) {
		d.Hour24 = +d.Hour24;
		d.PPFD = +d.PPFD;

	    });

	var keys = ["PPFD","PPFD_old"];

        var stack = d3.stack()
	    .keys(keys)
	    .order(d3.stackOrderNone)
	    .offset(d3.stackOffsetNone);
	var series = stack(result);
//	console.log(series);
	
//	console.log(result);

	x.domain([0, d3.max(result, function(d) { return d.Hour24;} )]);
        y.domain([0, d3.max(result,
			    function(d){

				return Math.max(
				    d.PPFD, d3.max(result,function(d){
					return d.PPFD_old;
				    })
				);
			    })

		 ]);
	
	z.domain(keys);

            // Add the X Axis
	svg.append("g")
	.attr("class","axis")
	    .attr("transform", "translate("+(margin.left+10)+","+(height+margin.top)+")")
	    .style("font-size", ".5em")	   
	        .call(d3.axisBottom(x));
	
	// Add the Y Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(margin.left+10)+","+margin.top+")")
		    .style("font-size", ".5em")
	        .call(d3.axisLeft(y));



	// text label for the x axes
	svg.append("text")
	.attr("class","axis")
	    .attr("transform","translate(" + ((width/2)+margin.left+10)+ " ," + (height + margin.top+40) + ")")
	        .style("text-anchor", "middle")
		.style("font-size", ".5em")
	        .text("Hour of the Day (0 - 23:30)");

	// text label for the y axes
	svg.append("text")
	.attr("class","axis")
	        .attr("transform", "rotate(-90)")
	    .attr("y", 0 + margin.left - 25)
	        .attr("x",0 - (height / 2) - margin.top)
	        .attr("dy", "1em")
	        .style("text-anchor", "middle")
		.style("font-size", ".5em")
	        .text("PPFD (\u03BC mol/m\u00B2/s)");
	svg.append("g")
	.attr("class","today")
	    .selectAll("g")
	    .data(series)
	    .enter()
	    .append('g')
	    .attr("fill",function(d){return z(d.key);})
	    .selectAll('rect')
	    .data(function(d){return d;})
	    .enter()
	    .append("rect")
	    .attr("x",function(d){return x(d.data.Hour24)+margin.left+10;})
	    .attr("y",function(d){return y(d[1])+margin.top;})
	    .attr("height",function(d){return y(d[0])-y(d[1]);})
	    .attr("width",(width*0.018));

    },
    
    join(lookupTable, mainTable, lookupKey, mainKey, select) {
	var l = lookupTable.length,
	    m = mainTable.length,
	    lookupIndex = [],
	    output = [];
	for (var i = 0; i < l; i++) { // loop through l items
	    var row = lookupTable[i];
	    lookupIndex[row[lookupKey]] = row; // create an index for lookup table
	}
	for (var j = 0; j < m; j++) { // loop through m items
	    var y = mainTable[j];
	    var x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
	    output.push(select(y, x)); // select only the columns you need
	}
	return output;
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
	_date.day365 = dateTo365.mathOnly(_date.year,_date.month,_date.day);
	return _date;
    },

    PPFD_daily_new(input){
	
        var height = $('#_svg_').outerHeight();

	var width = $('#_svg_').outerWidth();

        var svg = d3.select("div#_svg_").append("svg")
	
	    .attr("viewBox", "0 0 "+ (width/2)+" "+(width) +"")
	    .attr("preserveAspectRatio", "xMinYMin meet")


	    .classed("_svg_content_", true);

	var margin = {
	    top_scale:0.06,
	    right_scale:0.1,
	    bottom_scale:0.6,
	    left_scale:0.03,	    
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
	   
	    x.range([0,size.width]);
	    y.range([size.height,0]);
	
	});
	var date = this.date_process(input);	
	var filepath = "./assets/"+ date.year+"_PPFD_half_hourly.json";
	
	$('#_date_').submit(function(event){

            var year = $('input[name=year]:checked').val();
	    var month =('0'+$('input[name=month]:checked').val()).slice(-2);
	    var day =  ('0'+$('input[name=day]:checked').val()).slice(-2);
	    input = ""+year+month+day;
	    var test = self.date_process(input);


	    self.load(height,width, margin, input, x,y,z,svg, filepath, test, self.JSONfilenames, self.draw);
	    event.preventDefault();

	});
	
	this.load(height,width, margin, input, x,y,z,svg, filepath, date,this.JSONfilenames, this.draw);

	
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
    
    annual_DLI (input){

	var container = '#annual';
	var font_ticks = '.7em';
	var font_label = '1em';	

	var aspect_scale = 1;
	var height = $(container).outerHeight();
	var width = $(container).outerWidth();

        var margin = {
	    top_scale:0.03,
	    right_scale:0.01,
	    bottom_scale:0.18,
	    left_scale:0.1,
	    top:0,
	    right:0,
	    bottom:0,
	    left: 0
	};
	
	margin.top = margin.top_scale*height;
	margin.bottom = margin.bottom_scale*height;
	margin.left = margin.left_scale*width;
	margin.right = margin.right_scale*width;

	var x = d3.scaleLinear().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
		
  	var update = function(input){
	    
	    
	    $('#annual_content').remove();

            var svg = d3.select(container).append("svg")
	        .attr("viewBox", "0 0 "+(width)+" "+(height)+"")
	        .attr("preserveAspectRatio", "xMinYMin meet")
	        .classed("svg_content", true)
		.attr("id","annual_content");
	    
	    svg.selectAll('.axis').remove();
	    svg.selectAll('circle').remove();
	    
	    var date = self.date_process(input);
	    
	    var filepath = "./assets/"+ date.year+".json";
	    console.log(filepath);
	    d3.json(filepath).get((data)=>{

		console.log(data);
    
	    data.forEach(function(d) {
		d.Day365 = +d.Day365;
		d.DLI = +d.DLI;

	    });

		x.domain([0, d3.max(data, function(d) { return d.Day365; })]);
		y.domain([0, d3.max(data, function(d) { return d.DLI; })]);


		// Add the X Axis
		svg.append("g")
		    .attr("class","axis")
		    .attr("transform", "translate("+(margin.left)+","+(height-margin.bottom)+")")
		    .style("font-size", font_ticks)
		    .call(d3.axisBottom(x));

		// Add the Y Axis
		svg.append("g")
		    .attr("class","axis")
		    .attr("transform", "translate("+(margin.left)+","+margin.top+")")
		    .style("font-size", font_ticks)
		    .call(d3.axisLeft(y));

		// text label for the x axes
		svg.append("text")
		    .attr("class","axis")
		    .attr("transform","translate(" + ((width/2))+ " ," + (height-margin.bottom + 30) + ")")
		    .style("text-anchor", "middle")
		    .style("font-size", font_label)
		    .text("Day of the Year (0 - 365)");

		// text label for the y axes
		svg.append("text")
		    .attr("class","axis")
		    .attr("transform", "rotate(-90)")

		    .attr("y", 0 + margin.left - 40)
		    .attr("x",0 - (height - margin.top-margin.bottom)/2)

		    .attr("dy", "1em")
		    .style("text-anchor", "middle")
		    .style("font-size", font_label)
		    .text("DLI (mol/m\u00B2/d)");

		svg.append("g")
	            .attr("class","annual_DLI")
	            .selectAll("g")
	            .data(data)
	            .enter()
	            .append('circle')
	            .attr("r", 2)
	            .attr("transform", "translate("+(margin.left)+","+(margin.top)+")")
	            .attr("cx", function(d) { return x(d.Day365); })
	            .attr("cy", function(d) { return y(d.DLI); });
	    
	    });
	    
	};

	var _resize = function(){

            height=parseInt($(container).outerHeight());
	    margin.top = parseInt(margin.top_scale*height);
	    margin.bottom = parseInt(margin.bottom_scale*height);


	    width=parseInt($(container).outerWidth());
	    margin.right = parseInt(margin.right_scale*width);
	    margin.left = parseInt(margin.left_scale*width);

	    x = d3.scaleLinear().range([0,width-margin.left-margin.right]);
	    y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	    
	};
	
	update(input);

	
	$('#selectYear').on('input',(event)=>{

	    input = ""+event.currentTarget.value+"0000";

	    $('.label-annual').text("Solar Radiation Data for "+input.substring(0,4));

	    _resize();

	    update(input);
	});

	$(window).resize(function(){

	    _resize();

	});
	
    },

    daily(input) {
	    
	var container = '#day';
	var font_ticks = '.7em';
	var font_label = '1em';	

	var aspect_scale = 1;
	var height = $(container).outerHeight();
	var width = $(container).outerWidth();

        var margin = {
	    top_scale:0.03,
	    right_scale:0.01,
	    bottom_scale:0.18,
	    left_scale:0.1,
	    top:0,
	    right:0,
	    bottom:0,
	    left: 0
	};
	
	margin.top = margin.top_scale*height;
	margin.bottom = margin.bottom_scale*height;
	margin.left = margin.left_scale*width;
	margin.right = margin.right_scale*width;

	var x = d3.scaleLinear().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);

		
  	var update = function(input){
	    
	    var _date = self.date_process(input);
	    
	   
	    var filepath = "./assets/"+ _date.year+"_PPFD_half_hourly.json";
	  //  var filepath = "./assets/datalogger/"+ _date.year+".json";
	    
	    d3.json(filepath).get((_data)=>{
//		console.log(_data);
		
		var update2 = function(_input){
		    
		    
		    $('#daily_content').remove();
		    
		    var svg = d3.select(container).append("svg")
			.attr("viewBox", "0 0 "+(width)+" "+(height)+"")
			.attr("preserveAspectRatio", "xMinYMin meet")
			.classed("svg_content", true)
			.attr("id","daily_content");
		    
		    svg.selectAll('.axis').remove();
		    svg.selectAll('circle').remove();
		    
		    
		    date = self.date_process(_input);
		    var year = date.year;
		    var month = date.month_indexed; 
		    var day = date.day;
		 
		    var _day = dateTo365.mathOnly(year,month,day);

		    data = _data.filter(function(item){
			return item.Day365 == _day;
		    });

		    console.log(data);
		    
		    data.forEach(function(d) {
			d.LinearHours = +d.LinearHours;
			d.PPFD = +d.PPFD;
			
		    });
		    
		    

		    x.domain([0, d3.max(_data, function(d) { return d.LinearHours; })]);
		    y.domain([0, d3.max(_data, function(d) { return d.PPFD; })]);

		    
		    
		    // Add the X Axis
		    svg.append("g")
			.attr("class","axis")
			.attr("transform", "translate("+(margin.left)+","+(height-margin.bottom)+")")
			.style("font-size", font_ticks)
			.call(d3.axisBottom(x));
		    
		    // Add the Y Axis
		    svg.append("g")
			.attr("class","axis")
			.attr("transform", "translate("+(margin.left)+","+margin.top+")")
			.style("font-size", font_ticks)
			.call(d3.axisLeft(y));
		    
		    // text label for the x axes
		    svg.append("text")
			.attr("class","axis")
			.attr("transform","translate(" + ((width/2))+ " ," + (height-margin.bottom + 30) + ")")
			.style("text-anchor", "middle")
			.style("font-size", font_label)
			.text("Hour of the Day (0 - 23:30)");
		    
		    
		    // text label for the y axes
		    svg.append("text")
			.attr("class","axis")
			.attr("transform", "rotate(-90)")
		    
			.attr("y", 0 + margin.left - 45)
			.attr("x",0 - (height - margin.top-margin.bottom)/2)
		    
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.style("font-size", font_label)
			.text("PPFD (\u03BC mol/m\u00B2/s)");
			

		    svg.append("g")
			.attr("class","annual_DLI")
			.selectAll("g")
			.data(data)
			.enter()
			.append('circle')
			.attr("r", 2)
			.attr("transform", "translate("+(margin.left)+","+(margin.top)+")")
			.attr("cx", function(d) { return x(d.LinearHours); })
			.attr("cy", function(d) { return y(d.PPFD); });
		    
		    
		};//end updatte2
		
		update2(input);

	
		$('#selectMonth').on('input',(event)=>{

		    var input_month = parseInt(event.currentTarget.value)+1;

		    var month = ("000"+input_month).slice(-2);

		    var input_day = $('#selectDay').val();
		    var day = ("000"+input_day).slice(-2);

		    input = ""+date.year+month+day;

//		    console.log(input);
		    var month_text = $('#selectMonth :selected').text();
		   // console.log(month_text);
		    
		    $('.label-day').text("Daily Radiation for "+ month_text +" "+input_day);
		    
		    _resize();
		    
		    update2(input);
		});
		
		$('#selectDay').on('input',(event)=>{

		    var input_day = parseInt(event.currentTarget.value);

		    var day = ("000"+input_day).slice(-2);

		    var input_month = ($('#selectMonth').val()+1);

		    var month = ("000"+input_month).slice(-2);

		    input = ""+date.year+month+day;

//		    console.log(input);
		    var month_text = $('#selectMonth :selected').text();
		    //console.log(month_text);
		    
		    $('.label-day').text("Daily Radiation for "+ month_text +" "+input_day);
		    
		    _resize();
		    
		    update2(input);
		});
		
		
	});// end load function
			      
	};//end update

	var _resize = function(){

            height=parseInt($(container).outerHeight());
	    margin.top = parseInt(margin.top_scale*height);
	    margin.bottom = parseInt(margin.bottom_scale*height);


	    width=parseInt($(container).outerWidth());
	    margin.right = parseInt(margin.right_scale*width);
	    margin.left = parseInt(margin.left_scale*width);

	    x = d3.scaleLinear().range([0,width-margin.left-margin.right]);
	    y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	    
	};
	
	update(input);
	
	$('#selectYear').on('input',(event)=>{

	    var input_day = $('#selectDay').val();

	    var day = ("000"+input_day).slice(-2);

	    var input_month = ($('#selectMonth').val()+1);
	    
	    var month = ("000"+input_month).slice(-2);

	    var year = event.currentTarget.value;
	    
	    input = ""+year+month+day;

	    console.log(input);
	    
	    $('.label-annual').text("Annual Radiation for "+input.substring(0,4));

	    _resize();

	    update(input);
	});

	$(window).resize(function(){

	    _resize();

	});



    }

    
};