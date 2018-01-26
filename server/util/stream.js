
var $ = require("jquery");
var d3 = require("d3");
var _sun = require('suncalc');
var io = require('socket.io-client');

var compute = require("./compute.js");
var dateTo365 = require("./dateTo365.js");
var formatting = require('./formatting.js');
var async = require("async");
var visibility = require('visibilityjs');
var Promise = require("bluebird");
var _ = require('lodash');
var draw = require('./draw.js');
var timezoneOffset = 3600000 * 5;
var viewport = require('responsive-toolkit');


var self = module.exports = {

    
    query(queries){

	return new Promise(function(resolve,reject){

	    try{
		
		var prefix = '/api/client/stream/';
		var values = _.values(queries);

		var fileNameNew = values.map(function(elem){return prefix + elem;});

		return resolve(fileNameNew);

	    } catch(e){

		return reject(e);

	    }
	});

    },
    
    dashboard(data){

	return new Promise(function(resolve,reject){

	    try{

		self.updateDashboard(data[0]);

		return resolve(data);

	    } catch(e){

		return reject(e);

	    }
	});
    },

    updateDashboard(data){
	
	var max = data.find(function(elem){
	    return elem.T == d3.max(data,function(d){return d.T;});
	});

	var ppfd = (max.L + max.LL).toFixed(2);
	var dli = (max.DLI).toFixed(2);
	var power = (max.E*120).toFixed(2);

	var offset = 3600000;

	var date = new Date(max.T*1000+timezoneOffset);
			
	$('.ppfd-value').text(""+ppfd);
	$('.dli-value').text(""+dli);
	$('.power-value').text(""+power);
	$('.time-value-year').text(""+date.getFullYear()+"-");
	$('.time-value-month').text(""+(date.getMonth()+1)+"-");
	$('.time-value-day').text(""+("00"+date.getDate()).slice(-2) +"");
		
	$('.time-value-hour').text(""+date.getHours()+":");
	$('.time-value-minute').text(""+date.getMinutes()+":");
	$('.time-value-second').text(""+date.getSeconds());
	

    },
    
    draw(data){

	return new Promise(function(resolve,reject){

	    try{
		var target = '#stream-graph';
		var key_index = [2,3,7];
		
		d3.select('.first').select('svg').remove();
		$('.realtime-description, .dashboard , .yesterday, .today').fadeIn();
		
		data[0].reverse();
		console.log(data);
		visibility.onVisible(function(){
		    
		    self.draw_stream_graph(data[0],target,key_index);
		    
		});
		
		return resolve(data);
	    } catch(e){
		return reject(e);
	    }
	});
    },

    yesterday(data){
	
	return new Promise(function(resolve,reject){

	    try {

		var target = '#yesterday';

		var key_index = [7,15];
		
		self.draw_yesterday(data[1],target,key_index);
		
		self.resize(data,target,key_index);
		
		return resolve(data);

	    } catch(e){
		return reject(e);
	    }

	});

    },


    today(data){

	return new Promise(function(resolve,reject){

	    try {

		var target = '#today';

		var key_index = [7,15];

		self.draw_day(data[2],target,key_index);

		self.resize(data,target,key_index);

		return resolve(data);

	    } catch(e){
		return reject(e);
	    }

	});

    },

    draw_yesterday(data,target,key_index){
	
	var svg, keys, container, font_ticks, font_label, height, width, margin;

	[svg, keys, container, font_ticks, font_label, height, width, margin] = self.init(data,target);

	data = _.filter(data);
	
	_.pullAll(keys,['_id','T']);

	margin.bottom *= 0.8;

	var parseDate =  d3.timeParse("%Y-%m-%d-%H-%M");
//	var parseDate =  d3.timeParse("%Y-%m-%d-%H");

	var x = d3.scaleTime().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var y2= d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "lightskyblue"]);

	y.domain([0, 1250.0]);
	y2.domain([0,25.0]);
	
	x.domain(d3.extent(data,function(d,i){
	    return parseDate(""+d.Year+"-"+d.Month+"-"+d.Day+"-"+d.Hour+"-"+d.Minute) ;
	})
		);
	
	var newKeys = ['L','DLI'];

	z.domain(newKeys);

	for (i=0;i<data.length;i++){
	    data[i].L = + data[i].L;
	    data[i].LL = + data[i].LL;
	    data[i].DLI = + data[i].DLI;
	}
	
	var stack = d3.stack().keys(newKeys);
	var stacked = stack(data);

	
//	console.log(stacked);

	var area = d3.area()
	    .curve(d3.curveMonotoneX)

	    .x(function(d,i){
		return x( parseDate(""+d.data.Year+"-"+d.data.Month+"-"+d.data.Day+"-"+d.data.Hour+"-"+d.data.Minute) ) + margin.left;
	    })
	    .y0(function(d) { return y(d[0]); })
	    .y1(function(d) { return y(d[1]); });

	var dli = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d){

		return x( parseDate(""+d.Year+"-"+d.Month+"-"+d.Day+"-"+d.Hour+"-"+d.Minute) ) + margin.left;
	    })

	    .y0(function(d){return y2(0); })
	    .y1(function(d){return y2(d.DLI);})
	;
	
	var pathGroup = svg.append('g')
	    .attr("class","pathGroup")
	    .attr("transform","translate(0,"+ margin.top+")")
	;

	console.log(data);

	pathGroup.append('path')
	    .attr("d",dli(data))
	    .attr("class","dli")
	    .attr("fill",function(){return z('DLI');})
	;
	
	pathGroup.selectAll('path.area2')
	    .data(stacked)
	    .enter()
	    .append('path')
	    .attr("class",function(d,i){return "area2 stack"+i;})
	    .attr("fill",function(d,i){

		return z(d.key);})
	    .attr("d",function(d){return area(d);});



	//=========================================================================legend
	var _DLI = d3.max(data, function(d){return +d.DLI;});
	
	_DLI = _DLI.toFixed(2);
	
	var legendRectSize = 15;
	var legendSpacing = 4;
	var labels = ["PPFD", "DLI"];
	var offset = 40;
	
	svg.append("g")
	    .attr("class","legend")
	    .append("text")
	    .attr("transform","translate("+(width - margin.right - margin.left - offset) +","+(margin.top+(margin.bottom/3))+")")
//	    .style("font-size",font_label)
	    .attr("text-anchor","start")
	    .text(_DLI+" mol/m\u00B2/d");
	


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
	    .attr("fill",function(d,i){
		return z(d);
	    })
	    .attr("stroke",function(d){return d3.color(z(d)).darker(1);})
	    .attr("class",function(d,i){return "rect"+i;})
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
//	    .style("font-size", font_ticks)
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
//	    .style("font-size", font_label)
	    .text("PPFD (\u03BC mol/m\u00B2/s)");
	
	// text label for the y2 axes
	svg.append("text")
	    .attr("class","label")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + width - margin.right + 30)
	    .attr("x",0 - (height/2))
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
//	    .style("font-size", font_label)
	    .text("DLI (mol/m\u00B2/d)");
	
	
    },

    
    draw_day(data,target,key_index){
	
	var svg, keys, container, font_ticks, font_label, height, width, margin;

	[svg, keys, container, font_ticks, font_label, height, width, margin] = self.init(data,target);


	_.pullAll(keys,['_id','T','LL']);

	margin.bottom *= 0.8;

	var parseDate =  d3.timeParse("%Y-%m-%d-%H-%M");
//	var parseDate =  d3.timeParse("%Y-%m-%d-%H");

	var x = d3.scaleTime().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var y2= d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "lightskyblue"]);
	
	y.domain([0, 1250.0]);
	y2.domain([0,25.0]);
	
	x.domain(d3.extent(data,function(d){return parseDate(""+d._id.year+"-"+d._id.month+"-"+d._id.day+"-"+d._id.hour+"-"+d._id.minute) ; }));
//	x.domain(d3.extent(data,function(d){return parseDate(""+d._id.year+"-"+d._id.month+"-"+d._id.day+"-"+d._id.hour) ; }));

	z.domain(keys);

//	console.log(z.domain());

	var stack = d3.stack().keys(keys);
	var stacked = stack(data);

	
//	console.log(stacked);

	var area = d3.area()
	    .curve(d3.curveMonotoneX)

	    .x(function(d){	
		return x( parseDate(""+d.data._id.year+"-"+d.data._id.month+"-"+d.data._id.day+"-"+d.data._id.hour+"-"+d.data._id.minute) ) + margin.left;
	    })
	    .y0(function(d) { return y(d[0]); })
	    .y1(function(d) { return y(d[1]); });

	var dli = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d){	
		return x( parseDate(""+d._id.year+"-"+d._id.month+"-"+d._id.day+"-"+d._id.hour+"-"+d._id.minute) ) + margin.left;
	    })

	    .y0(function(){return y2(0); })
	    .y1(function(d){return y2(d.DLI);})
	;
	
	var pathGroup = svg.append('g')
	    .attr("class","pathGroup")
	    .attr("transform","translate(0,"+ margin.top+")")
	;
	
	pathGroup.append('path')
	    .attr("d",dli(data))
	    .attr("class","dli")
	    .attr("fill",function(){return z('DLI');})
	;
	
	pathGroup.selectAll('path.area2')
	    .data(stacked)
	    .enter()
	    .append('path')
	    .attr("class",function(d,i){return "area2 stack"+i;})
	    .attr("fill",function(d,i){

		return z(d.key);})
	    .attr("d",function(d){return area(d);});



	//=========================================================================legend
	var _DLI = d3.max(data, function(d){return d.DLI;});
	
	_DLI = _DLI.toFixed(2);
	
	var legendRectSize = 15;
	var legendSpacing = 4;
	var labels = ["PPFD", "DLI"];
	var offset = 40;
	
	svg.append("g")
	    .attr("class","legend")
	    .append("text")
	    .attr("transform","translate("+(width - margin.right - margin.left - offset) +","+(margin.top+(margin.bottom/3))+")")
//	    .style("font-size",font_label)
	    .attr("text-anchor","start")
	    .text(_DLI+" mol/m\u00B2/d");

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
//	    .style("font-size", font_ticks)
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
//	    .style("font-size", font_label)
	    .text("PPFD (\u03BC mol/m\u00B2/s)");
	
	// text label for the y2 axes
	svg.append("text")
	    .attr("class","label")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + width - margin.right + 30)
	    .attr("x",0 - (height/2))
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
//	    .style("font-size", font_label)
	    .text("DLI (mol/m\u00B2/d)");
	
	
    },


    
    init(data,target){

	d3.selectAll("text").interrupt();		

	var keys = d3.keys(data[0]);

        var container = target;

	var svgtest = d3.select(container).select('svg');

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
	    bottom_scale:0.3,
	    left_scale:0.2,
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
    
    
    draw_stream_graph(data,target,key_index){
	
	var svg, keys, container, font_ticks, font_label, height, width, margin;
	
	[svg, keys, container, font_ticks, font_label, height, width, margin] = this.init(data,target);



//	margin.top *=0.3;
//	margin.left *= 1.5;
//	margin.right *= 1.4;
	
	
	var offsetY = height-margin.bottom;

	var offsetY2 = (height*0.75)+margin.top;

	data.forEach(function(d){
	    d.L = +d.L;
	});
	
	var parseDate = d3.timeParse('%Y-%m-%d-%H-%M-%S');

	
	var extentY = [0,1250];
	
	var extentX2 = d3.extent(data, function(d){return new Date((d.T*1000)+timezoneOffset);});

	var x2 = d3.scaleTime().range([0,width+margin.left]).domain(extentX2);

	var y = d3.scaleLinear().range([offsetY,0]).domain(extentY);
	var y3 = d3.scaleLinear().range([offsetY,0]).domain([0,25.0]);
	
	var height2 = height - offsetY2 - (margin.top*2);
	
	var y2 = d3.scaleLinear().range([height2, 0]).domain(extentY);
	var y4 = d3.scaleLinear().range([height2,0]).domain([0,30.0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink","dodgerblue"]);

	z.domain(["L","LL","DLI"]);

	keys = [keys[key_index[0]],keys[key_index[1]]];

	var stack = d3.stack().keys(keys);
	var stacked = stack(data);
	
	var x = d3.scaleTime().range([0,width+margin.left]).domain(x2.domain());

	var xAxis = d3.axisBottom(x);
	
	svg.append("defs").append("clipPath")
	    .attr("id","clip")
	    .append("rect")
	    .attr("height",height)
	    .attr("width", width-margin.left-margin.right)
	    .attr("x",margin.left)
	;


	var brush = d3.brushX()
	    .extent([[0,0],[width,height2]])
	    .on("brush end",brushed)
	;
	
	var brushEnd = x2(x2.domain()[1]) - margin.left - margin.right;
	var brushWidthFactor = 2.5;
	var lookbackIndex = ((data.length / brushWidthFactor)<1)? 1: Math.floor(data.length/brushWidthFactor);
	var lookbackMilliseconds = data[data.length-lookbackIndex].T*1000 + timezoneOffset;

	var brushBegin = x2(new Date(lookbackMilliseconds));

	var minScale = (x.range()[1]-x.range()[0])/(brushEnd-brushBegin);
//	console.log("minscale: %s",minScale);
	var zoom = d3.zoom()
	    .scaleExtent([1,minScale])
	    .translateExtent([[0,0],[width,height]])
	    .extent([[0,0],[width,height]])
	    .on("zoom",zoomed)
	;


	var area = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d) {
		return x(new Date((d.data.T*1000 + timezoneOffset))); })	
	    .y0(function(d,i){return y(d[0]);})
	    .y1(function(d){return y(d[1]);})

	;

	var area2 = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d,i){ return x2(new Date((d.data.T*1000 + timezoneOffset))); })
	    .y0(function(d){return y2(d[0]); })
	    .y1(function(d){return y2(d[1]); })
	;

	var dli = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d,i){ return x2(new Date((d.T*1000 + timezoneOffset))); })

	    .y0(function(){return y3(0); })
	    .y1(function(d){return y3(d.DLI);})
	;
	
	var dli2 = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d,i){ return x(new Date((d.T*1000 + timezoneOffset))); })

	    .y0(function(){return y4(0); })
	    .y1(function(d){return y4(d.DLI);})
	;
	

	var context = svg.append("g")
	    .attr("class","context")
	    .attr("clip-path","url(#clip)")
	    .attr("transform","translate(0,"+(offsetY2-height2)+")")	
	;

	
	var focus = svg.append("g")
	    .attr("class","focus")
	    .attr("clip-path","url(#clip)")
	    .attr("transform","translate(0,"+(margin.top)+")")
	
	;
	
	var pathGroupFocus  = svg.select(".focus").append("g")
	    .attr("class","pathGroupFocus")
	;

	
	var pathGroupContext = svg.select(".context").append("g")
	    .attr("class","pathGroupContext")
	;


	pathGroupFocus.append('path')
	    .attr("d",dli(data))
	    .attr("class","dli")
	    .attr("fill",function(){return z('DLI');})
	;

	pathGroupFocus.selectAll(".areaZoom")
	    .data(stacked)
	    .enter().append("path")
	    .attr("class",function(d,i){return "areaZoom stack"+i;})
	    .attr("fill",function(d,i){
		return z(d.key); })
	    .attr("d",area)
	;
	
	pathGroupFocus.append("g")
	    .attr("class","axis axis--x x1")
	    .attr("transform","translate("+(0)+","+(offsetY)+")")
	    .call(xAxis.ticks(5))

	;


	svg.append("g")
	    .attr("class","axis axis--y")
	    .attr("transform","translate("+margin.left+","+margin.top+")")
	    .call(d3.axisLeft(y).ticks(3))
	;

	svg.append("text")
	    .attr("class","label streamGraph-label")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + margin.left - 50)
	    .attr("x",0 - height/2)
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
//	    .style("font-size", font_label)
	    .text("PPFD (\u03BC mol/m\u00B2/s)")
	;


	svg.append("g")
	    .attr("class","axis axis--y3")
	    .attr("transform","translate("+(width-margin.right)+","+margin.top+")")
	    .call(d3.axisRight(y3).ticks(5))
	;

	svg.append("text")
	    .attr("class","label streamGraph-label")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + width - margin.right + 30)
	    .attr("x",0 - offsetY/2 - margin.top)
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
//	    .style("font-size", font_label)
	    .text("DLI (mol/m\u00B2/d)")
	;

/*
	pathGroupContext.append('path')
	    .attr("d",dli2(data))
	    .attr("class","dli")
	    .attr("fill",function(){return z('DLI');})
	;


	
	pathGroupContext.selectAll(".areaZoomContext")
	    .data(stacked)
	    .enter().append("path")
	    .attr("class",function(d,i){return "areaZoomContext stack"+i;})
	    .attr("fill",function(d,i){

		return z(d.key); })
	    .attr("d",area2)
	;

	pathGroupContext.append("g")
	    .attr("class","axis axis--x x2")
	    .attr("transform","translate(0,"+(height2)+")")
	    .call(d3.axisBottom(x2).ticks(3))
	;


	
	context.append("g")
	    .attr("class","brush")
	    .call(brush)
	    .call(brush.move,[brushBegin,brushEnd])
	;

	svg.append("rect")
	    .attr("class","zoom")
	    .attr("width",width)
	    .attr("height",offsetY)
	    .attr("transform","translate("+margin.left+","+margin.top+")")
	    .call(zoom)
	    .call(zoom.transform,d3.zoomIdentity
		  .scale((x.range()[1]-x.range()[0])/(brushEnd-brushBegin))
		  .translate(-brushBegin,0)
		 );
*/
	var brushExtent = [brushBegin,brushEnd];

	
	function brushed(){


	    if(d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return ;// ignore brush-by-zoom

	    
	    var s = d3.event.selection || x2.range();

	    brushExtent = s;
	    
	    x.domain(s.map(x2.invert, x2));

	    pathGroupFocus.selectAll(".areaZoom")
		.data(stacked)
		.attr("d",area)
	    ;

	    focus.select(".x1").call(d3.axisBottom(x));


	    svg.select(".zoom").call(zoom.transform,d3.zoomIdentity
				     .scale((x.range()[1]-x.range()[0])/(s[1]-s[0]))
				     .translate(-s[0],0)
				    );

	}

	function zoomed(){

	    if(d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return ; // ignore zoom-by-brush
	    
	    var t = d3.event.transform;
	    
	    x.domain(t.rescaleX(x2).domain());

	    d3.select(".x1").call(d3.axisBottom(x));
	    
	    pathGroupFocus.selectAll(".areaZoom")
		.data(stacked)
		.attr("d",area)
	    ;

	    var brushPosition = x.range().map(t.invertX,t);
	    
	    brushExtent = brushPosition;
	    
	    context.select(".brush").call(brush.move,brushPosition);
	}

	
	function tick(incoming_data){
//	    console.log(incoming_data);
//=============================================================update context

	

	    var _extent = d3.extent(data,function(d){return d.T;});
	    var start = new Date(_extent[1]*1000+timezoneOffset);
	    var end = new Date(incoming_data[0].T*1000+timezoneOffset);
	    var transformContext = x2(end) - x2(start);

	    data = data.concat(incoming_data);	    
	    data.shift();

	    self.updateDashboard(data);
	    
	    stacked = stack(data);
	    var duration = 150;
	    

	    x2.domain(d3.extent(data,function(d){return new Date(d.T*1000 + timezoneOffset); }));
/*	    	    
	    svg.select(".x2")
		.call(d3.axisBottom(x2))
	    ;
	    
	    pathGroupContext.selectAll(".areaZoomContext")
		.data(stacked)
		.attr("d",area2)
	    ;

	    pathGroupContext.selectAll('.dli')
		.attr("d",dli2(data))
	    
	    ;
	    pathGroupContext.attr("transform",null);
*/	    


	    var t = d3.transition().duration(duration).ease(d3.easeLinear);

		pathGroupContext
		    .transition(t)
	    	    .attr("transform","translate("+(-1*transformContext)+",0)")

	    ;

//=============================================================update focus


	    var pixels = brushExtent[1] + transformContext;

	    var date = x2.invert(pixels);
	    
	    var transformFocus = x(date) - x(x2.invert(brushExtent[1]));
	    
	    pathGroupFocus.attr("transform",null);
	    
	    x.domain(brushExtent.map(x2.invert, x2));	    

	    svg.select(".x1")
		.call(d3.axisBottom(x).ticks(5))
	    ;

	    pathGroupFocus.selectAll('.dli')
		.attr("d",dli(data))
	    
	    ;
	    
	    pathGroupFocus.selectAll(".areaZoom")
		.data(stacked)
		.attr("d",area)
	    ;

	    var t2 = d3.transition().duration(duration).ease(d3.easeLinear);
	    
	    pathGroupFocus
		.transition(t)
		.attr("transform","translate("+(-1*transformFocus)+",0)")

	    ;



	}


	function socket(){


	    var host = location.origin.replace(/^http/,"ws");

	    var ws = new WebSocket(host+"/api/client/socket");

	    
	    ws.onopen = function(){
		console.log("Websocket Connected!");

	    };

	    ws.onclose = function(){
		console.log("Websocket Disconnected!");
	    };

	    ws.onmessage = function(payload){
//		console.log(payload);
		var incoming_data = JSON.parse(payload.data);
//		console.log(incoming_data);

		if (visibility.state() == 'visible'){
		    tick(incoming_data);
		}



	    };

	    

 	}socket();


/*
	//=========================================================================legend
	var _DLI = d3.max(data, function(d){return d.DLI;});
	
	_DLI = _DLI.toFixed(2);
	
	var legendRectSize = 15;
	var legendSpacing = 4;
	var labels = ["PPFD Sunlight","PPFD Electric", "DLI"];
	var offset = 40;
	
	svg.append("g")
	    .attr("class","legend")
	    .append("text")
	    .attr("transform","translate("+(width - margin.right - margin.left - offset) +","+(margin.top)+")")
//	    .style("font-size",font_label)
	    .attr("text-anchor","start")
	    .text(_DLI+" mol/m\u00B2/d");

	svg.select(".legend")
	    .selectAll(".legend2")
	    .data(z.domain())
	    .enter()
	    .append("g")
	    .attr("transform","translate("+(width - margin.right-margin.left - offset) +","+(margin.top+legendSpacing)+")")
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
*/


	

	function draw_stream(_data){

	    self.draw_stream_graph(data,target,key_index);

	}

	$(window).on('window:resize',function() {

	    
	    clearTimeout(window.resizedFinished2);

	    window.resizedFinished2 = setTimeout(viewport.changed(function() {

		if(viewport.is('xs')) {
		    console.log('xs');

		}

		if(viewport.is('sm')) {
		    console.log('sm');
		    $('#stream-graph').css({"padding-bottom":"15%"});
		    draw_stream(data);
		}

		if(viewport.is('md')) {
		    console.log('md');
		    $('#stream-graph').css({"padding-bottom":"25%"});
		    draw_stream(data);
		}

		if(viewport.is('lg')) {
		    console.log('lg');
		    $('#stream-graph').css({"padding-bottom":"15%"});
		    draw_stream(data);

		}


	    }), 250);
	});
	
    },
    
    resize(data,target, key_index){



	$(window).on('window:resize',function() {
	    
	    
	    clearTimeout(window.resizedFinished);

	    window.resizedFinished = setTimeout(viewport.changed(function() {

		if(viewport.is('xs')) {
		    console.log('xs');

		}

		if(viewport.is('sm')) {
		    console.log('sm');

		    $("#yesterday, #today").css({"padding-bottom":"65%"});
		    self.draw_day(data[1],'#yesterday',key_index);
		    self.draw_day(data[2],'#today',key_index);
		  

		}

		if(viewport.is('md')) {
		    console.log('md');
		    
		    $("#yesterday, #today").css({"padding-bottom":"50%"});
		    self.draw_day(data[1],'#yesterday',key_index);
		    self.draw_day(data[2],'#today',key_index);
		  
		    
		}

		if(viewport.is('lg')) {
		    console.log('lg');
		    $("#yesterday, #today").css({"padding-bottom":"45%"});
		    self.draw_day(data[1],'#yesterday',key_index);
		    self.draw_day(data[2],'#today',key_index);
		  
		}


	    }), 250);
	});


    }



};
