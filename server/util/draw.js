var $ = require("jquery");
var d3 = require("d3");
var _sun = require('suncalc');
var compute = require("./compute.js");
var dateTo365 = require("./dateTo365.js");
var formatting = require('./formatting.js');
var async = require("async");
var Promise = require("bluebird");
var _ = require('lodash');


var self = module.exports = {

    query(fileName){
		
	return new Promise(function(resolve,reject){

	    try {
		
		var prefix = "./assets/processed/";
		var suffix = ".json";
		var fileNameNew = prefix + fileName + suffix;
		return resolve(fileNameNew);
		
	    } catch(e){
		return reject(e);
	    }


	});
    },

    load(fileName){

	return new Promise(function(resolve,reject){

	    try {

		d3.request(fileName)
		    .mimeType("application/json")
		    .response(function(xhr) { return JSON.parse(xhr.responseText); })
		    .on('error',function(e){
			return reject(e);
		    })
		    .get(function(data){
			return resolve(data);
		    });

	    } catch(e){
		return reject(e);
	    }
	    
	});
    },

    annual(data){

	return new Promise(function(resolve,reject){

	    try {
		var target = '#annual';
		
		var key_index = [8,13];

		
		var year,month,day;
		[input,year,month,day] = self.formInput();	   
		var date = self.dateProcess(input);
		self.draw_annual(data,target,key_index,date);

		return resolve(data);

	    } catch(e){
		return reject(e);
	    }

	});

    },

    daily(data){

	return new Promise(function(resolve,reject){

	    try{


		self.datePicker(data);
		
		return resolve(data);
		
	    } catch(e){
		return reject(e);
	    }
	});
    },

    datePicker(data){
	
	var key_index = [10,6];
	
	var input = "20150001";
	
	var date = self.dateProcess(input);

	
	$('#selectMonth, #selectMonthRadar').on('input',(event)=>{

	    var year,month,day;
	    [input,year,month,day] = self.formInput();	   
	    
	    d3.selectAll('.active')
		.attr("class",function(d,i){ return "D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);})
		.attr("r","2");

	    d3.selectAll(".D"+month+day).attr("class","active").attr("r","10");

	    date = self.dateProcess(input);
	    
	    self.draw_daily(data,key_index,date);	
	});


	$('#selectDay').on('input',(event)=>{

	    var year,month,day;
	    [input,year,month,day] = self.formInput();	   
	   
	    d3.selectAll('.active')
		.attr("class",function(d,i){ return "D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);})
		.attr("r","2");
	    
	    d3.selectAll(".D"+month+day).attr("class","active").attr("r","10");
	   	   
	    date = self.dateProcess(input);
	    
	    self.draw_daily(data,key_index,date);	

	    
	});

	
	self.draw_daily(data,key_index,date);	
    },
    
    handleMouseOver(d,i,elem,data,target,key_index,date){

	var year = $('#selectYear').val();
	var month = ("000"+d.Month).slice(-2);
	var day = ("000"+d.Day).slice(-2);

	this.update_text(year,month,day);

	var input = ""+year+month+day;

	
	date = self.dateProcess(input);
	
	d3.selectAll('.active')
	    .attr("r","2")
	    .attr("class",function(d){return "D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);});
	
	d3.selectAll(".D"+month+day).attr("class","active").attr("r","10");
	console.log(data);
	console.log(date);

	self.draw_daily(data,[10,6],date);	

	
    },
    
    init(data,target){
	
	var keys = d3.keys(data[0]);

        var container = target;

	var svgtest = d3.select(container).select('svg').selectAll(".points, .axis, .legend, .radarGroup");

	if(!svgtest.empty()){

	    svgtest.remove();

	}

	var font_ticks = '.6em';
	var font_label = '.9em';

	var height = $(container).outerHeight();
	var width = $(container).outerWidth();

	var margin = {
	    top_scale:0.03,
	    right_scale:0.01,
	    bottom_scale:0.2,
	    left_scale:0.15,
	    top:0,
	    right:0,
	    bottom:0,
	    left: 0
	};

	margin.top = margin.top_scale*height;
	margin.bottom = margin.bottom_scale*height;
	margin.left = margin.left_scale*width;
	margin.right = margin.right_scale*width;

	var svg = d3.select(container).select('svg').attr("viewBox", "0 0 "+(width)+" "+(height)+"");

	if (svg.empty()){

	    svg.remove();

	    svg = d3.select(container).append("svg")
	        .attr("viewBox", "0 0 "+(width)+" "+(height)+"")
	        .attr("preserveAspectRatio", "xMinYMin meet")
	        .classed("svg_content", true)
	        .attr("id","svg_content");
	}

	return [svg, keys, container, font_ticks, font_label, height, width, margin];

	
    },
    


    
    draw_annual(data,target,key_index,date){

	var svg, keys, container, font_ticks, font_label, height, width, margin;

	[svg, keys, container, font_ticks, font_label, height, width, margin] = self.init(data,target);

//	console.log(key_index);

//	console.log(data);
//	data.pop();

//	console.log(keys);

	var newKeys = key_index.map((i)=>{return keys[i];});
	
//	console.log(keys);
//	console.log(data);

	var days = new Array(366);

	for (i=1; i < days.length; i++){
	    days[i]=i;
	}
//	console.log(index);
	var dataNew = [];

	days.forEach(function(elem,i){
	    
	    var index = _.findLastIndex(data,function(d){return parseInt(d.Day365) == i;});
	    
	    if (index != -1){
		dataNew.push(data[index]);
	    }
	    
	    
	});
	
	var parseDate =  d3.timeParse("%Y-%j");

	var x = d3.scaleTime().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink"]);
			
	y.domain([0, d3.max(dataNew, function(d) { return d[newKeys[1]]; })]);
	
	x.domain(d3.extent(dataNew,function(d){return parseDate(""+d.Year+"-"+d[newKeys[0]]) ; }));	
//	console.log(x.domain());
//	console.log(y.domain());

	dataNew.forEach(function(d) {
	    d[newKeys[0]] = +d[newKeys[0]];
	    d[newKeys[1]] = +d[newKeys[1]];
	
	});

	svg.append("g")
	    .attr("class","points")
	    .selectAll("g")
	    .data(dataNew)
	    .enter()
	    .append('circle')
	    .attr("r", 2)
	    .attr("transform", "translate("+(margin.left)+","+(margin.top)+")")
	    .attr("cx", function(d) { return x(parseDate(""+d.Year+"-"+d[newKeys[0]])); })
	    .attr("cy", function(d) { return y(d[newKeys[1]]); })
	
	
	    .attr("class",function(d,i){
		
		return (d.Month == date.month && d.Day == date.day)?"active":"D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);
	    })
	    .attr("r",function(d,i){
		return (d.Month == date.month && d.Day == date.day)?"10":"2";
	    })
	
	    .on("mousemove",function(d,i){
				
		
		var elem = this;

		
		self.handleMouseOver(d,i,elem,data,target,key_index,date);
		
	    });


	var mean = d3.mean(data, function(d){return d[newKeys[1]]; });
//	console.log(mean);
	// Add the X Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(margin.left)+","+(height-margin.bottom)+")")
	    .style("font-size", font_ticks)
	    .call(d3.axisBottom(x))
	    .selectAll('text')
	    .attr("transform","rotate(-45)")
	    .style("text-anchor", "end");
	// Add the Y Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(margin.left)+","+margin.top+")")
	    .style("font-size", font_ticks)
	    .call(d3.axisLeft(y));

	// text label for the y axes
	svg.append("text")
	    .attr("class","axis")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + margin.left - 50)
	    .attr("x",0 - (height - margin.top-margin.bottom)/2)
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
	    .style("font-size", font_label)
	    .text("DLI (mol/m\u00B2/d)");

	

    },


    draw_daily(data,key_index,date){

	var target = '#daily';
	
	var svg, keys, container, font_ticks, font_label, height, width, margin;

	[svg, keys, container, font_ticks, font_label, height, width, margin] = this.init(data,target);



//	console.log(data);
  //      console.log(keys);
//	console.log(key_index);
	var newKeys = key_index.map((i)=>{return keys[i];});

//	console.log(newKeys);
	
	var x = d3.scaleTime().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink"]);
			
	y.domain([0, d3.max(data, function(d) { return d[newKeys[1]]; })]);

//	console.log(date);

	var timezoneOffset = 3600000*5;

	console.log(data);
	console.log(date);
	console.log(timezoneOffset);
	
	var dataNew = self.getDay(data,date,timezoneOffset);

	data.forEach(function(d) {
	    d[newKeys[key_index[0]]] = +d[newKeys[key_index[0]]];
	    d[newKeys[key_index[1]]] = +d[newKeys[key_index[1]]];
	
	});
	
//	console.log(dataNew);

	
	x.domain(d3.extent(dataNew,function(d){return new Date((d.T*1000)+timezoneOffset); }));	

	console.log(x.domain());

	var area = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d){ return x(new Date((d.T*1000)+timezoneOffset)) + margin.left; })
	    .y0(height-margin.bottom)
	    .y1(function(d) { return y(d[newKeys[1]])+margin.top; });
	
	svg.select('path.area')
	    .transition()
	    .duration(250)
	    .attr("d",area(dataNew));
	
	if(svg.select('path.area').empty()){
	    
	    svg.append('path')
		.attr('d', area(dataNew))
		.attr("class","area");
	    
	    
	}


	//=========================================================================legend


	var DLI = d3.max(dataNew, function(d){return d.DLI;});
	
	DLI = DLI.toFixed(2);
	
	var legendRectSize = 15;
	var legendSpacing = 4;
	var labels = ["Sunlight"];
	var offset = 50;
	
	svg.append("g")
	    .attr("class","legend")
	    .append("text")
	    .attr("transform","translate("+(width - margin.right - margin.left - offset) +","+(margin.top+(margin.bottom/3))+")")
	    .style("font-size",font_label)
	    .attr("text-anchor","start")
	    .text(DLI+" mol/m\u00B2/d");


	svg.select(".legend")
	    .append("g")	
	    .attr("transform","translate("+(width - margin.right-margin.left - offset) +","+(margin.top+(margin.bottom/3)+legendSpacing)+")")
	    .attr("class","legend2")
	    .append("rect")
	    .attr("height",legendRectSize)
	    .attr("width",legendRectSize)
	    .attr("transform",function(d,i){

		var horz = 0;
		var vert = (legendRectSize+legendSpacing)*i;

		return 'translate('+horz+','+vert+')';
		
	    })
	    .attr("fill",function(d,i){return z(d);});

	
	svg.selectAll('.legend2').selectAll("text")
	    .data(labels)
	    .enter()
	    .append("text")
	    .attr("transform",function(d,i){
		
		var horz = 0;
		var vert = (legendRectSize+legendSpacing)*i;
		
		return 'translate('+(horz+(legendRectSize+legendSpacing))+','+(vert+legendRectSize - legendSpacing)+')';
		
	    })
	    .text(function(d){
	
		return d; })
	    .attr("font-size",font_label);

//=======================================================================================end legend
	
	
	// Add the X Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(margin.left)+","+(height-margin.bottom)+")")
	    .style("font-size", font_ticks)
	    .call(d3.axisBottom(x))
	    .selectAll('text')
	    .attr("transform","rotate(-45)")
	    .style("text-anchor", "end");
	// Add the Y Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(margin.left)+","+margin.top+")")
	    .style("font-size", font_ticks)
	    .call(d3.axisLeft(y));

	// text label for the y axes
	svg.append("text")
	    .attr("class","axis")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + margin.left - 50)
	    .attr("x",0 - (height - margin.top-margin.bottom)/2)
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
	    .style("font-size", font_label)
	    .text("PPFD (\u03BC mol/m\u00B2/s)");	


	
    },

    getDay(data,date, zone){
	var offset = 3600000 *2;
	var sunrise = Date.parse(data.find(function(d){return d.Day365 == date.Day365;}).Sunrise);
	sunrise = new Date(sunrise+zone - offset);


	var nextSunrise;

	var index = _.findLastIndex(data,function(d){return d.Day365 == date.Day365;});

	if (index != data.length-1){

	    nextSunrise = Date.parse(data[index+1].Sunrise);
	    nextSunrise = new Date(nextSunrise+zone - offset);
	    
	} else {
	    console.log("ran");
	    nextSunrise = Date.parse(data[data.length-1].Sunrise);
	    nextSunrise = new Date(nextSunrise+zone+86400000 - offset);
	}
	
	console.log(sunrise);
	console.log(nextSunrise);
	



	var day = data.filter(function(item,index){
	    
	    var _date = new Date(item.Year, item.Month, item.Day, item.Hour, item.Minute);
	    return (_date >= sunrise && _date < nextSunrise );
	    
	});

	return day;
    },

    dateProcess(date){
	console.log(date);
	
	var _date = {
	    year: parseInt(date.substring(0,4)),
	    month: parseInt(date.substring(4,6)),
	    day: parseInt(date.substring(6,8)),

	};

	_date.Day365 = dateTo365.mathOnly(_date.year,_date.month,_date.day);
	_date.T = new Date(_date.year,_date.month,_date.day);

	return _date;
    },
    
    formInput(){

	var year  = ($('#selectYear').val() == 'TMY') ? 1974 : $('#selectYear').val();
	
	var month = ("000"+$('#selectMonth').val()).slice(-2);
	
	var day = ("000"+$('#selectDay').val()).slice(-2);
	
	self.update_text(year,month,day);
	
	input = ""+year+month+day;

	return [input,year,month,day];
    },

    update_text(year, month, day){

	var prefix = "Irradiance for ";
	var prefix2 = "Irradiance + Lassi for ";
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	month = parseInt(month);

	day = parseInt(day);
	$('.label-annual').text(prefix+year);
	$('.label-day').text(prefix+ months[month] +" "+day);

	$('.label-annual-lassi').text(prefix2+year);
	$('.label-daily-lassi').text(prefix2+ months[month] +" "+day);

	if (month === 0){

	    $('#selectMonth, #selectMonthRadar').val("00");
	    
	}else{
	    $('#selectMonth, #selectMonthRadar').val(month);
	}
	if(day == 1){

	    $('#selectDay').val("1");
	
	} else {
	    $('#selectDay').val(day);
	}
    },




















    
    main2(){

	this.chartAnnual('#annual',"/api/client/year/","2015", [2,3]);

	this.chartDaily("#daily","/api/client/day/","2015", [8,7]);
	
	this.chartAnnual('#annual-lassi',"/api/client/year/","2015", [2,4]);

	this.chartDaily("#daily-lassi","/api/client/datalogger/","2015",[10,1,2]);

	this.chartRadar("#radar-plot","/api/client/rules/","2015",[0,3]);
    },
    
    chartAnnual(target,prefix,suffix,key_index){

	var input = "20150001";
	
	$('#selectYear').on('input',(event)=>{

	    
	    var year = event.currentTarget.value;
	    
	    var month =  ("000"+$('#selectMonth').val()).slice(-2);
	    
	    var day = ("000"+$('#selectDay').val()).slice(-2);
	    
	    this.update_text(year,month,day);
	    
	    input = ""+year+month+day;

	    suffix = year;
	    
	    this.update(target,prefix,suffix,input, key_index);

//	    this.update("#daily","/api/client/day/","2015",input, [8,7]);
 
	});

	this.update(target,prefix,suffix,input,key_index);

    },
    
    chartRadar(target,prefix,suffix,key_index){

	var input = "20150001";

	
	$('#selectMonthRadar, #selectMonth').on('input',(event)=>{

	    var year  = $('#selectYear').val();
	    
	    var month = ("000"+event.currentTarget.value).slice(-2);

	    var day = ("000"+$('#selectDay').val()).slice(-2);
	    
	    this.update_text(year,month,day);
	    
	    input = ""+year+month+day;
	    
	    d3.selectAll('.active')
		.attr("class",function(d,i){ return "D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);})
		.attr("r","2");

	    d3.selectAll(".D"+month+day).attr("class","active").attr("r","10");

//	    console.log(input);
	    
	    this.update(target,prefix,suffix,input,key_index);

	    
	});
	
	this.update(target,prefix,suffix,input,key_index);
    },


    handleMouseMoveRadar(d,i,elem){
	
	var parseDate =  d3.timeParse("%Y-%j");
	
	var _date = parseDate(d.data.Year+"-"+d.data.Day365);
	
	var year = _date.getFullYear();
	var month = ("000"+_date.getMonth()).slice(-2);
	var day = ("000"+_date.getDate()).slice(-2);
	
	self.update_text(year,month,day);
		    
	var input = ""+year+month+day;
	
	var date = this.date_process(input);
	
	var selector = $(elem).attr("class");

	d3.select(".radarGroup")
	    .selectAll(".activeRadar")
	    .attr("class",function(d,i){
		
		var __date = parseDate(d.data.Year+"-"+d.data.Day365);
		var _month = ("000"+__date.getMonth()).slice(-2);
		var _day = ("000"+__date.getDate()).slice(-2);

		return "radar"+_month+_day; 
	    })
	;
	
	d3.select(".radarGroup")
	    .selectAll("."+selector)
	    .attr("class", "activeRadar")
	; 


	d3.selectAll('.active')
	    .attr("r","2")
	    .attr("class",function(d){return "D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);});
	
	d3.selectAll(".D"+month+day).attr("class","active").attr("r","10");

	var suffix = year;
	
	this.update("#daily","/api/client/day/",suffix,input,[8,7]);
	this.update("#daily-lassi","/api/client/datalogger/",suffix,input,[10,1,2]);
	

	
    },
    
    
    update(target,prefix,suffix,input,key_index, daily,init){
	
	
	var date = this.date_process(input);

	var filepath = "" + prefix + suffix;
	
//	console.log(filepath);
	
	d3.json(filepath).get((data)=>{
	    

	    switch(target){

	    case "#annual":
		console.log("ran annual");
//		console.log(data);
		this.draw_annual(data,target,key_index,date);
		break;


	    case "#daily":
		console.log("ran daily");
//		console.log(data);
		this.draw_daily(data,target,key_index,date);
		break;

	    case "#annual-lassi":
		console.log("ran annual-lassi");
//		console.log(data);
		this.draw_annual(data,target,key_index,date);
		break;

	    case "#daily-lassi":
		console.log("ran daily-lassi");
//		console.log(data);
		this.draw_daily_lassi(data,target,key_index,date);
		break;

		
	    case "#radar-plot":
		console.log("ran radar-plot");
//		console.log(data);
		this.draw_radar_plot(data,target,key_index,date);
		break;

	    case"#stream-graph":
		console.log("ran stream graph");
//		console.log(data);
		this.draw_stream_graph(data,target,key_index,date);
		break;

  }

	});

    },

    _init(data,target){
	
	var keys = d3.keys(data[0]);

        var container = target;

	var svgtest = d3.select(container).select('svg').selectAll(".points, .axis, .legend, .radarGroup");

	if(!svgtest.empty()){

	    svgtest.remove();

	}

	var font_ticks = '.6em';
	var font_label = '.9em';

	var height = $(container).outerHeight();
	var width = $(container).outerWidth();

	var margin = {
	    top_scale:0.03,
	    right_scale:0.01,
	    bottom_scale:0.2,
	    left_scale:0.15,
	    top:0,
	    right:0,
	    bottom:0,
	    left: 0
	};

	margin.top = margin.top_scale*height;
	margin.bottom = margin.bottom_scale*height;
	margin.left = margin.left_scale*width;
	margin.right = margin.right_scale*width;

	var svg = d3.select(container).select('svg').attr("viewBox", "0 0 "+(width)+" "+(height)+"");

	if (svg.empty()){

	    svg.remove();

	    svg = d3.select(container).append("svg")
	        .attr("viewBox", "0 0 "+(width)+" "+(height)+"")
	        .attr("preserveAspectRatio", "xMinYMin meet")
	        .classed("svg_content", true)
	        .attr("id","svg_content");
	}

	return [svg, keys, container, font_ticks, font_label, height, width, margin];

	
    },

    draw_daily_lassi(data,target,key_index,date){

	var svg, keys, container, font_ticks, font_label, height, width, margin;

	[svg, keys, container, font_ticks, font_label, height, width, margin] = this.init(data,target);

	/*
	console.log(data);
        console.log(keys);
	console.log(key_index);
        console.log(container);
        console.log(font_ticks);
        console.log(font_label);
        console.log(height);
        console.log(width);
        console.log(margin);
*/

	var x = d3.scaleTime().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink"]);
			
	
	data.forEach(function(d) {
	    d[keys[key_index[0]]] = +d[keys[key_index[0]]];
	    d[keys[key_index[1]]] = +d[keys[key_index[1]]];
	
	});
	
	y.domain([0, d3.max(data, function(d) { return d[keys[key_index[1]]]; })]);

	data = this.select_day(data,date);	

	//console.log(data);

	var timezoneOffset = 3600000*4;

	x.domain(d3.extent(data,function(d){return new Date((d.T*1000)+timezoneOffset); }));
	
	var _keys = [keys[key_index[1]],keys[key_index[2]]];
	
	z.domain(_keys);
	
	var stack = d3.stack().keys(_keys);

	
	var area2 = d3.area()
	    .curve(d3.curveMonotoneX)	
	    .x(function(d){return x(new Date((d.data.T*1000)+timezoneOffset))+margin.left;})
	    .y0(function(d){return y(d[0])+margin.top;})
	    .y1(function(d){return y(d[1])+margin.top;});
		
	var stacked = stack(data);
	
	svg.selectAll('.area2')
	    .data(stacked)
	    .transition()
	    .duration(250)
	    .attr("d",function(d){return area2(d);});
	
	if(svg.select('path.area2').empty()){
	    
	    svg.selectAll('path.area2')
		.data(stacked)
		.enter()
		.append('path')
		.attr("class",function(d,i){return "area2 stack"+i;})
		.attr("fill",function(d){return z(d.key);})
		.attr("d",function(d){return area2(d);});
	    
	}
	
	//=========================================================================legend

	
	var DLI = data.reduce(function(sum,value){ return sum + value[keys[key_index[1]]]+value[keys[key_index[2]]]; },0);
	
	DLI = DLI*1800/1000000;
	DLI = DLI.toFixed(2);
	
	var legendRectSize = 15;
	var legendSpacing = 4;
	var labels = ["Sunlight","Electric"];
	var offset = 50;
	
	svg.append("g")
	    .attr("class","legend")
	    .append("text")
	    .attr("transform","translate("+(width - margin.right - margin.left - offset) +","+(margin.top+(margin.bottom/3))+")")
	    .style("font-size",font_label)
	    .attr("text-anchor","start")
	    .text(DLI+" mol/m\u00B2/d");


	svg.select(".legend")

	    .selectAll(".legend2")
	    .data(z.domain())
	    .enter()
	    .append("g")
	
	    .attr("transform","translate("+(width - margin.right-margin.left - offset) +","+(margin.top+(margin.bottom/3)+legendSpacing)+")")
	    .attr("class","legend2")
	    .append("rect")
	    .attr("height",legendRectSize)
	    .attr("width",legendRectSize)
	    .attr("transform",function(d,i){

		var horz = 0;
		var vert = (legendRectSize+legendSpacing)*i;

		return 'translate('+horz+','+vert+')';
		
	    })
	    .attr("fill",function(d,i){return z(d);});

	
	svg.selectAll('.legend2').selectAll("text")
	    .data(labels)
	    .enter()
	    .append("text")
	    .attr("transform",function(d,i){
		
		var horz = 0;
		var vert = (legendRectSize+legendSpacing)*i;
		
		return 'translate('+(horz+(legendRectSize+legendSpacing))+','+(vert+legendRectSize - legendSpacing)+')';
		
	    })
	    .text(function(d){
	
		return d; })
	    .attr("font-size",font_label);

//=======================================================================================end legend

/*
	svg.select("legend1").selectAll('text')	
	    
	    .data(labels)
	    .enter().exit()
	    .append("text")
	    .attr("transform","translate(100,100)")
	    .text(function(d,i){
		
		console.log(d);
		
		return d;
	    });
*/	
	    	
	
	// Add the X Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(margin.left)+","+(height-margin.bottom)+")")
	    .style("font-size", font_ticks)
	    .call(d3.axisBottom(x))
	    .selectAll('text')
	    .attr("transform","rotate(-45)")
	    .style("text-anchor", "end");

	// Add the Y Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(margin.left)+","+margin.top+")")
	    .style("font-size", font_ticks)
	    .call(d3.axisLeft(y));

	// text label for the y axes
	svg.append("text")
	    .attr("class","axis")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + margin.left - 50)
	    .attr("x",0 - (height - margin.top-margin.bottom)/2)
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
	    .style("font-size", font_label)
	    .text(function(){return (daily)? "PPFD (\u03BC mol/m\u00B2/s)" : "DLI (mol/m\u00B2/d)"; });	





	
    },

    draw_radar_plot(data,target,key_index,date){

	var svg, keys, container, font_ticks, font_label, height, width, margin;
	
	[svg, keys, container, font_ticks, font_label, height, width, margin] = this.init(data,target);


//	console.log(data);
/*	
	console.log(keys);

	console.log(key_index);
	console.log(container);
	console.log(font_ticks);
	console.log(font_label);
	console.log(height);
	console.log(width);
	console.log(margin);
*/

	var month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October','November', 'December'];
	
//	console.log(data);

	var parseDate =  d3.timeParse("%Y-%j");
	
	data = data.filter(function(elem){
	    
	    var _date = parseDate(""+elem.Year+"-"+elem.Day365);
	    return _date.getMonth() === date.month;
	});
	
//	console.log(keys);
	
	keys = keys.slice(0,12);

//	console.log(keys);
	
	var innerRadius = height/5;
	
	var outerRadius = (height/1.6)-margin.top-margin.bottom;
	
	var x = d3.scaleBand().range([0,2*Math.PI]).align(0);
	
	var y = d3.scaleLinear()
	    .range([innerRadius,outerRadius]);

	var z = d3.scaleOrdinal(d3.schemeCategory20c);

	x.domain(data.map(function(d){
	    return parseDate(""+date.year+"-"+d.Day365).getDate();
	}));
	
	y.domain([0,48]);

	z.domain(keys);
	
	var stack = d3.stack().keys(keys);
	var stacked = stack(data);

	var arc = d3.arc()
	    .innerRadius(function(d){return y(d[0]) ;})
	    .outerRadius(function(d){return y(d[1]); })
	    .startAngle(function(d){
		
		return x(parseDate(""+date.year+"-"+d.data.Day365).getDate()) ;
	    })
	    .endAngle(function(d){
		
		return x(parseDate(""+date.year+"-"+d.data.Day365).getDate()) + x.bandwidth() ;
	    })
	    .padAngle(0.01)
	    .padRadius(innerRadius)

	;
	
	svg.append("g")
	    .attr("class","radarGroup")
	    .selectAll("g")
	    .data(stacked)
	    .enter().append("g")
	    .attr("transform","translate("+((width/2))+","+(height/2)+")")
	    .attr("fill",function(d){return z(d.key);})
	    .selectAll("path")
	    .data(function(d){return d; })
	    .enter().append("path")
	    .attr("class",function(d,i){

		var _date = parseDate(d.data.Year+"-"+d.data.Day365);
		var _month = ("000"+_date.getMonth()).slice(-2);
		var _day = ("000"+_date.getDate()).slice(-2);
		
		return "radar"+_month+_day ;

			       })
	    .attr("d",function(d){ return arc(d);})
	    .on("mousemove",function(d,i){
				
		var run = true;
		var day = d.data.Day365;

		var _data = d3.select(".activeRadar")
		    .attr("id",function(d,i){

			if (day != d.data.Day365){
			    run = true;
			} else {
			    run = false;
			}
			return ; 
		    });

		
		if(run){
		    
		    var elem = this;
		    		    
		    
		    self.handleMouseMoveRadar(d,i,elem);
		    
		}
	    })
	;

	var label = svg.append("g")
	    .attr("class","radarLabel legend")
	    .attr("transform","translate("+((width/2))+","+(height/2)+")")
	    .selectAll("g")
	    .data(data)
	    .enter().append("g")
	    .attr("text-anchor","middle")
	    .attr("transform",function(d){ return "rotate("+((x(parseDate(""+date.year+"-"+d.Day365).getDate()) + x.bandwidth() / 2 )*180/Math.PI -90)+")translate("+innerRadius+",0)" ;
	})
	;

	label.append("line")
	    .attr("x2", -5)
	    .attr("stroke","#000");
	
	label.append("text")
	    .attr("transform",function(d){ return ((x(parseDate(""+date.year+"-"+d.Day365).getDate()) + x.bandwidth() / 2 + Math.PI / 2) % (2*Math.PI) )< Math.PI ?
					   "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)" ;
					 })
	    .text(function(d){return parseDate(""+date.year+"-"+d.Day365).getDate() ; })
	    .style("font-size",font_ticks)
	;

	var yAxis = svg.append("g")
	    .attr("text-anchor","middle")
	    .attr("class","yAxis legend")
	    .attr("transform","translate("+((width/2))+","+(height/2)+")")
	;

	var arcTick = d3.arc()
	    .innerRadius(function(d){return y(d) ; })
	    .outerRadius(function(d){return y(d)+2 ; })
	    .startAngle(-10*Math.PI/180)
	    .endAngle(10*Math.PI/180)
	;

	var yTick = yAxis.selectAll("path")
	    .data([10,20,30,40,50])
	    .enter().append("path")
	    .attr("d",function(d){ return arcTick(d); })

	;

	yAxis.selectAll("text")
	    .data([10,20,30,40,50])
	    .enter().append("text")
	    .attr("y",function(d){return -y(d);})
	    .attr("dy","-0.5em")
	    .attr("font-size",font_ticks)
	    .attr("stroke-width",5)
	    .text(y.tickFormat(5,"s"))
	;

	yAxis.append("text")
	    .attr("y",function(d){return -y(60); })
	    .attr("font-size",font_label)
	    .text("Times Rule Called")
	;
/*
	var legend = svg.append("g")
	    .attr("transform","translate("+((width*0.8))+","+(height/2)+")")
	    .selectAll("g")
	    .data(keys)
	    .enter().append("g")
	    .attr("transform",function(d,i){

		return "translate(-40,"+(i-(keys.length-1)/2)*20 +")";
	    })
	;

	legend.append("rect")
	    .attr("height",height/10)
	    .attr("width",height/10)
	    .attr("fill",z)
	;
	
	legend.append("text")
	    .attr("x","24")
	    .attr("y","9")
	    .attr("dy","0.35em")
	    .text(function(d){return d ; })
	;
*/



	keys.forEach(function(elem,i){



	    d3.select('.rule'+i)
	    .style("background-color",function(){
		    return z(i);
		})
	;
	    
	});
	
	    

	

	svg.append("text")
	    .attr("class","legend")
	    .attr("transform","translate("+((width/2))+","+(height/2)+")")
	    .attr("text-anchor","middle")
	    .text(function(){return month_names[date.month] ; })
	;


    }


};
