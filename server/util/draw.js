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

    targets(targets){

	return new Promise(function(resolve,reject){

	    try{
	
		return resolve(targets);
	    } catch(e){
		return reject(e);
	    }
	    
	});
	
    },
    
    animation(target){
	return new Promise(function(resolve,reject){

	    function blink() {
		    
		svg.select("text").transition()
		    .duration(250)
		    .style("fill", "rgb(255,255,255)")
		    .transition()
		    .duration(250)
		    .style("fill", "rgb(0,0,0)")
		    .on("end", blink);
		
		}
	    
	    try{
		

		var data = [{}];
		var svg, keys, container, font_ticks, font_label, height, width, margin;
		
		[svg, keys, container, font_ticks, font_label, height, width, margin] = self.init(data,target);


		// text label for the y axes
		svg.append("text")
		    .attr("class","axis")
		    .attr("transform","translate("+(width/2)+","+(height/3)+")")
		    .style("text-anchor", "middle")
		    .style("font-size","1.5em")
		    .text("Loading!");

		blink();
		
		return resolve(target);
	    } catch(e){
		return reject(e);
	    }
	    
	});
	
    },
    
    query(fileNames){

	return new Promise(function(resolve,reject){

	    try {
		
		var prefix = "./assets/processed/";
		var suffix = ".json";
		var values = _.values(fileNames);
		
		var fileNamesNew = values.map(function(elem){return prefix + elem + suffix;});

		return resolve(fileNamesNew);
		
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
//			console.log(data);
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
		
		var key_index = [7,15];

		var year,month,day;

		[input,year,month,day] = self.formInput();	   

		var date = self.dateProcess(input);

		self.draw_annual(data,target,key_index,date);

//		console.log(data);
		
		return resolve(data);

	    } catch(e){
		return reject(e);
	    }

	});

    },

    annualLassi(data){

	return new Promise(function(resolve,reject){

	    try {
		var target = '#annual-lassi';
		
		var key_index = [7,14];
		
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

		var target = '#daily';
		var key_index = [6,15];
		var year = data[0][0].Year;
		self.datePicker(data,target,key_index,year);
		
		return resolve(data);
		
	    } catch(e){
		return reject(e);
	    }
	});
    },

    dailyLassi(data){

	return new Promise(function(resolve,reject){

	    try{

		var target = '#daily-lassi';
		var key_index = [6,12,14];
		var year = data[0][0].Year;

		self.datePicker(data,target, key_index,year);
		
		return resolve(data);
		
	    } catch(e){
		return reject(e);
	    }
	});
    },

    radarPlot(data){

	return new Promise(function(resolve,reject){
	    try{

		var target = "#radar-plot";

		var input,year,month,day;

		[input,year,month,day] = self.formInput();	   
		
		var date = self.dateProcess(input);

		self.drawRadarPlot(data,target,[0,0],date);
		
		return resolve(data);
		
	    } catch(e){
		
		return reject(e);

	    }
	});
    },

    updateDashboardHistorical(_data,target,__date){

	var data = _data[0];

	var rules = _data[1];
	
	var dli = d3.select('.active').data()[0].DLI.toFixed(2);
	$('.dli-value-historical').text(""+dli);

	var dliNew = d3.select('.active').data()[0].DLInew.toFixed(2);
	$('.dli-value-historical-lassi').text(""+dliNew);

    },

    updateDashboardStatistics(data,dliData){

	var count = data[1].filter(function(d){return d[0]!==0;});

	$('.days-active-value').text(""+count.length);

	var daysActive = [];
	
	count.forEach(function(elem){

	    var match = dliData.find(function(d){
		return d.Day365 == elem.Day365;
	    });
	    
	    daysActive.push(match);
	    
	});
	
	var daysExceeded = daysActive.filter(function(d){ return d.DLInew >= 18.0;}).length;
	var daysDeficient = daysActive.filter(function(d){ return d.DLInew < 17.0;}).length;

	$('.days-exceeded-value').text(""+daysExceeded);
	$('.days-deficient-value').text(""+daysDeficient);

	var variance = d3.variance(daysActive,function(d){return d.DLInew;}).toFixed(2);
	var deviation = d3.deviation(daysActive,function(d){return d.DLInew;}).toFixed(2);

	$('.variance-value').text(""+variance);
	$('.deviation-value').text(""+deviation);
	

	
    },

    updateDashboardDaily(data,target,date){

	var ppfd = d3.mean(data,function(d){return parseInt(d.L);}).toFixed(2);

	$('.ppfd-value-historical').text(""+ppfd);
	
	
	var L = d3.sum(data,function(d){return parseInt(d.L);});
	var LL = d3.sum(data,function(d){return parseInt(d.LL);});

	ppfd = ((L+LL) / data.length).toFixed(2);
	
	$('.ppfd-value-historical-lassi').text(""+ppfd);

	var _date = new Date(date.year,date.month,date.day);
	
	if (_date.getFullYear() == 1974){ $('.time-value-year-historical').text("TMY-");}else{$('.time-value-year-historical').text(""+_date.getFullYear()+"-");}

	$('.time-value-month-historical').text(""+(_date.getMonth()+1)+"-");
	$('.time-value-day-historical').text(""+("00"+_date.getDate()).slice(-2) +"");

	
    },

    
    datePicker(data,target,key_index,year){
	
	var input = ""+year+"0001";
	
	var date = self.dateProcess(input);
	
	$('#selectMonth,#selectMonthRadar').on('input',(event)=>{


	    var year,month,day;
	    [input,year,month,day] = self.formInput(event);	   
	    
	    d3.selectAll('.active')
		.attr("class",function(d,i){ return "D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);})
		.attr("r","2");

	    d3.selectAll(".D"+month+day).attr("class","active").attr("r","10");
	    
	    date = self.dateProcess(input);

	    self.updateDashboardHistorical(data,'#annual',date);
	
	    self.draw_daily_new(data,target,key_index,date);

	    self.drawRadarPlot(data,"#radar-plot",[0,0],date);

	});

	
	$('#selectDay').on('input',(event)=>{

	    var year,month,day;
	    [input,year,month,day] = self.formInput();	   
	   
	    d3.selectAll('.active')
		.attr("class",function(d,i){ return "D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);})
		.attr("r","2");
	    
	    d3.selectAll(".D"+month+day).attr("class","active").attr("r","10");
	   	   
	    date = self.dateProcess(input);
	    
	    self.updateDashboardHistorical(data[0],'#annual',date);

	    self.draw_daily_new(data,target,key_index,date);
	
	    	    
	});
	
	self.updateDashboardHistorical(data,'#annual',date);
		    
	self.draw_daily_new(data,target,key_index,date);
	
    },
    
    handleMouseOver(d,i,elem,data,target,key_index,date){

	var year = ($('#selectYear').val() == "tmy")? 1974 : $('#selectYear').val();
	var month = ("000"+d.Month).slice(-2);
	var day = ("000"+d.Day).slice(-2);

	this.update_text(year,month,day);

	var input = ""+year+month+day;


	date = self.dateProcess(input);

	d3.selectAll('.active')
	    .attr("r","2")
	    .attr("class",function(d){return "D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);});
	
	d3.selectAll(".D"+month+day).attr("class","active").attr("r","10");

	self.updateDashboardHistorical(data,target,date);
	
	self.draw_daily_new(data,"#daily",[6,15],date);
	self.draw_daily_new(data,"#daily-lassi",[6,12,14],date);
	
	self.drawRadarPlot(data,"#radar-plot",[0,0],date);
    },

    handleMouseMoveRadar(d,i,elem,data,target){
	
	var parseDate =  d3.timeParse("%Y-%j");
	
	var _date = parseDate(d.data.Year+"-"+(d.data.Day365+1));

	var year = _date.getFullYear();
	var month = ("000"+_date.getMonth()).slice(-2);
	var day = ("000"+_date.getDate()).slice(-2);
	
	this.update_text(year,month,day);

	var input = ""+year+month+day;
	
	var date = self.dateProcess(input);
	
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

	self.updateDashboardHistorical(data,target,date);
	
	self.draw_daily_new(data,"#daily",[6,15],date);
	self.draw_daily_new(data,"#daily-lassi",[6,12,14],date);


		
    },
    
    init(data,target){
	
	var keys = d3.keys(data[0]);

        var container = target;

	var svgtest = d3.select(container).select('svg').selectAll(".points, .axis, .legend, .radarGroup,.label");

	if(!svgtest.empty()){

	    svgtest.remove();

	}

	var font_ticks = '.6em';
	var font_label = '.9em';

	var height = $(container).outerHeight();
	var width = $(container).outerWidth();

	var margin = {
	    top_scale:0.05,
	    right_scale:0.2,
	    bottom_scale:0.25,
	    left_scale:0.3,
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
       
    draw_annual(_data,target,key_index,date){

	var data = _data[0];
	
	var svg, keys, container, font_ticks, font_label, height, width, margin;

	[svg, keys, container, font_ticks, font_label, height, width, margin] = self.init(data,target);

	var newKeys = key_index.map((i)=>{return keys[i];});

	margin.right *= 0.1;

	var days = new Array(366);

	for (i=1; i < days.length; i++){
	    days[i]=i;
	}


	var dataNew = [];

	var timezoneOffset = 3600000*5;

	
	days.forEach(function(elem,i){

	    var chunk = data.filter(function(elem){
		return elem.Day365 == days[i];
	    });

	    var index = chunk.findIndex(function(elem){
		
		var sunrise = (new Date(Date.parse(elem.Sunrise)+timezoneOffset));
		var current = (new Date(elem.T*1000+timezoneOffset));
		
		return sunrise.getHours() == current.getHours() && parseInt(elem.Minute) === 0;
		
	    });

	    var obj = chunk[index-1];

	    if (obj){	
	
		obj.DLI = (obj.Day365==1) ? 12.87 : obj.DLI;
		obj.DLInew = (obj.Day365==1) ? 17.91 : obj.DLInew;
		
		dataNew.push(obj);
		
	    } else {
//		console.log(index);
	    }

	});
	
	dataNew =_.filter(dataNew);

	self.updateDashboardStatistics(_data,dataNew);	

	var parseDate =  d3.timeParse("%Y-%j");

	var x = d3.scaleTime().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink"]);
			
	y.domain([0, d3.max(dataNew, function(d) { return d[newKeys[1]]; })]);
	
	x.domain(d3.extent(dataNew,function(d){return parseDate(""+d.Year+"-"+d[newKeys[0]]) ; }));	

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
		
		self.handleMouseOver(d,i,elem,_data,target,key_index,date);
		
	    });
	
	// Add the X Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(margin.left)+","+(height-margin.bottom)+")")
//	    .style("font-size", font_ticks)
	    .call(d3.axisBottom(x))
	    .selectAll('text')
	    .attr("transform","rotate(-45)")
	    .style("text-anchor", "end");
	// Add the Y Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(margin.left)+","+margin.top+")")
	    .style("font-size", font_ticks)
	    .call(d3.axisLeft(y).ticks(5));

	// text label for the y axes
	svg.append("text")
	    .attr("class","label")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + margin.left - 60)
	    .attr("x",0 - (height)/2)
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
//	    .style("font-size", font_label)
	    .text("DLI (mol/m\u00B2/d)");

	

    },


    draw_daily_new(_data,target,key_index,date){

	var data = _data[0];
	var svg, keys, container, font_ticks, font_label, height, width, margin;

	[svg, keys, container, font_ticks, font_label, height, width, margin] = this.init(data,target);


	var newKeys = key_index.map((elem,i)=>{

	    if (i < key_index.length-1){
		return keys[elem];
	    } else {
		return ;
	    }	    

	});
	
	newKeys = _.filter(newKeys);
	
	var x = d3.scaleTime().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink", "lightskyblue"]);
	var y2= d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	
	y.domain([0, 2500]);
	y2.domain([0,70]);

	var timezoneOffset = 3600000*5;
		
	var dataNew = self.getDay(data,date.Day365,timezoneOffset);

	self.updateDashboardDaily(dataNew,target,date);
	
	x.domain(d3.extent(dataNew,function(d){return new Date((d.T*1000)+timezoneOffset); }));

	z.domain(["L","LL","DLI"]);
	
	var stack = d3.stack().keys(newKeys);

        var dli = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d){return x(new Date((d.T*1000)+timezoneOffset))+margin.left;})
	    .y0(function(){return y2(0)+margin.top; })
	    .y1(function(d){return y2(d[keys[key_index[key_index.length-1]]])+margin.top;})
	;
		
	var area2 = d3.area()
	    .curve(d3.curveMonotoneX)	
	    .x(function(d){return x(new Date((d.data.T*1000)+timezoneOffset))+margin.left;})
	    .y0(function(d){return y(d[0])+margin.top;})
	    .y1(function(d){return y(d[1])+margin.top;});
		
	var stacked = stack(dataNew);
	
	if(svg.select('.area').empty()){
	 
	    svg.append('path')
	        .attr("d",dli(dataNew))
	        .attr("class","dli")
	        .attr("fill",function(){return z('DLI');})
	    ;
	    
	    svg.selectAll('.area')
		.data(stacked)
		.enter()
		.append('path')
		.attr("class",function(d,i){return "area stack"+i;})
		.attr("fill",function(d){return z(d.key);})
		.attr("d",function(d){return area2(d);});
	    
	} else {

	    svg.selectAll('.dli')
		.transition()
		.duration(250)
		.attr("d",dli(dataNew))
	    ;
	
	    svg.selectAll('.area')
		.data(stacked)
		.transition()
		.duration(250)
		.attr("d",function(d){return area2(d);});

	}
	
	//=========================================================================legend


	var DLI = (date.Day365==1) ? (target == '#daily')? 12.87:17.91: d3.max(dataNew.slice(dataNew.length-5),function(d){return d[keys[key_index[key_index.length-1]]];});
	
	DLI = DLI.toFixed(2);
	
	var legendRectSize = 15;
	var legendSpacing = 4;
	
	var offset = 50;
	
	var labels = (target == '#daily')? ["PPFD Sunlight", "DLI"] : ["PPFD Sunlight","PPFD Electric","DLI"];
	
	svg.append("g")
	    .attr("class","legend")
	    .append("text")
	    .attr("transform","translate("+(width - margin.right - margin.left - offset) +","+(margin.top+(margin.bottom/3))+")")
	    .attr("text-anchor","start")
	    .text(DLI+" mol/m\u00B2/d");
	
	var z_keys = (target == '#daily')? ["L", "DLI"] : ["L","LL","DLI"];
	
	svg.select(".legend")
	    .selectAll(".legend2")
	    .data(z_keys)
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
	    .attr("fill",function(d,i){return z(d);})
	    .attr("class",function(d,i){return "rect"+i;})
	    .attr("stroke",function(d){return d3.color(z(d)).darker(1);})
	;
	
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

	// Add the X Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(margin.left)+","+(height-margin.bottom)+")")
	    .call(d3.axisBottom(x))
	    .selectAll('text')
	    .attr("transform","rotate(-45)")
	    .style("text-anchor", "end");

	// Add the Y Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(margin.left)+","+margin.top+")")
	    .call(d3.axisLeft(y).ticks(5));
        // Add the Y2 Axis
	svg.append("g")
	    .attr("class","axis")
	    .attr("transform", "translate("+(width - margin.right)+","+margin.top+")")
	    .call(d3.axisRight(y2).ticks(5));
	
	// text label for the y axes
	svg.append("text")
	    .attr("class","label")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + margin.left - 60)
	    .attr("x",0 - (height)/2)
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")

	    .text(function(){return (daily)? "PPFD (\u03BC mol/m\u00B2/s)" : "DLI (mol/m\u00B2/d)"; });	


	// text label for the y2 axes
	svg.append("text")
	    .attr("class","label")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + width - margin.right + 30)
	    .attr("x",0 - (height/2))
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
	
	    .text("DLI (mol/m\u00B2/d)");
	
    },


    
    drawRadarPlot(data,target,key_index,date){

	var svg, keys, container, font_ticks, font_label, height, width, margin;
	
	[svg, keys, container, font_ticks, font_label, height, width, margin] = this.init(data,target);

	var month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October','November', 'December'];
	
	var parseDate =  d3.timeParse("%Y-%j");
	
	var dataNew = data[1].filter(function(elem){
 	    
	    var _date = parseDate(""+elem.Year+"-"+elem.Day365);
	    return _date.getMonth() === date.month;
	   
	});

	dataNew.forEach(function(elem){
	    elem.Day365 = +elem.Day365;
	});
	
	keys = keys.slice(0,12);

	var innerRadius = height/5;
	
	var outerRadius = (height/1.45)-margin.top-margin.bottom;
	
	var x = d3.scaleBand().range([0,2*Math.PI]).align(0);
	
	var y = d3.scaleLinear()
	    .range([innerRadius,outerRadius]);

	var z = d3.scaleOrdinal(d3.schemeCategory20c);

	x.domain(dataNew.map(function(d){
	    return parseDate(""+date.year+"-"+d.Day365).getDate();
	}));

	if (date.year == 1974){
	    y.domain([0,24]);
	}else{
	    y.domain([0,48]);
	}
	

	z.domain(keys);
	
	var stack = d3.stack().keys(keys);
	var stacked = stack(dataNew);

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
		    		    
		    
		    self.handleMouseMoveRadar(d,i,elem,data,target);
		    
		}
	    })
	;

//	console.log(date);

	var label = svg.append("g")
	    .attr("class","radarLabel legend")
	    .attr("transform","translate("+((width/2))+","+(height/2)+")")
	    .selectAll("g")
	    .data(data[1].filter(function(d){return x(parseDate(""+date.year+"-"+d.Day365).getDate()); }))
	    .enter().append("g")
	    .attr("text-anchor","middle")
	    .attr("transform",function(d,i){

		return "rotate("+((x(parseDate(""+date.year+"-"+(d.Day365-1)).getDate()) + x.bandwidth() / 2 )*180/Math.PI -90)+")translate("+innerRadius+",0)" ;
		
		
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
	    .attr("dy","-0.3em")
	//    .attr("font-size",font_ticks)
	    .attr("stroke-width",5)
	    .text(y.tickFormat(5,"s"))
	;

	yAxis.append("text")
	    .attr("y",function(d){return -y(60); })
	    .attr("dy","-0.3em")
	    .text("Times Rule Called")
	;

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


    },

    
    getDay(data, Day365, zone){
	
	Day365 = (Day365==1) ? Day365 : Day365-1 ;

	var offset = 3600000;
	
	var sunrise = Date.parse(data.find(function(d){return parseInt(d.Day365) == Day365;}).Sunrise);
	sunrise = new Date(sunrise+zone - offset);
	
	var nextSunrise;

	var index = _.findLastIndex(data,function(d){return parseInt(d.Day365) == Day365;});

	if (index != data.length-1){

	    nextSunrise = Date.parse(data[index+1].Sunrise);
	    nextSunrise = new Date(nextSunrise+zone - offset);
	    
	} else {
//	    console.log("ran");
	    nextSunrise = Date.parse(data[data.length-1].Sunrise);
	    nextSunrise = new Date(nextSunrise+zone+86400000 - offset);
	}
	
	



	var day = data.filter(function(item,index){
	    
	    var _date = new Date(item.Year, item.Month, item.Day, item.Hour, item.Minute);
	    return (_date >= sunrise && _date < nextSunrise );
	    
	});

	return day;
    },

    dateProcess(date){
	


	var _date = {

	    year: parseInt(date.substring(0,4)),
	    month: parseInt(date.substring(4,6)),
	    day: parseInt(date.substring(6,8)),

	};

	Date.prototype.isLeapYear = function() {
	    var year = this.getFullYear();
	    if((year & 3) !== 0) return false;
	    return ((year % 100) !== 0 || (year % 400) === 0);
	};

	// Get Day of Year
	Date.prototype.getDOY = function() {
	    var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
	    var mn = this.getMonth();
	    var dn = this.getDate();
	    var dayOfYear = dayCount[mn] + dn;
	    if(mn > 1 && this.isLeapYear()) dayOfYear++;
	    return dayOfYear;
	};

	

//	_date.Day365 = day;	
	_date.T = new Date(_date.year,_date.month,_date.day);
	_date.Day365 = _date.T.getDOY();
	

	return _date;
    },
    
    formInput(event){
	
	var year  = ($('#selectYear').val() == 'tmy') ? 1974 : $('#selectYear').val();

	var id = (event)? "#"+event.target.id : "#selectMonth";

	var month = ("000"+$(id).val()).slice(-2);
	
	var day = ("000"+$('#selectDay').val()).slice(-2);
	
	self.update_text(year,month,day);
	
	input = ""+year+month+day;

	return [input,year,month,day];
	
    },

    update_text(year, month, day){

	var prefix = "Irradiance for ";
	var prefix2 = "Irradiance + Algorithm for ";
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	month = parseInt(month);

	day = parseInt(day);
	year = (year == 1974) ? 'Typical Meteorological Year': year;
	
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















};
