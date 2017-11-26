
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


var self = module.exports = {

    
    query(queries){

	return new Promise(function(resolve,reject){

	    try{

		var prefix = '/api/client/stream/';
		var values = _.values(queries);

		var fileNameNew = values.map(function(elem){return prefix + elem;});

		console.log(fileNameNew);

		return resolve(fileNameNew);

	    } catch(e){
		return reject(e);
	    }
	});

    },

    draw(data){

	return new Promise(function(resolve,reject){

	    try{
		var target = '#stream-graph';
		var key_index = [2,3,7];
		
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

//		var year,month,day;
		
//		[input,year,month,day] = self.formInput();
		
		var date = draw.dateProcess(input);

		self.draw_yesterday(data[1],target,key_index);

		return resolve(data);

	    } catch(e){
		return reject(e);
	    }

	});

    },

    draw_yesterday(data,target,key_index){
	
	var svg, keys, container, font_ticks, font_label, height, width, margin;

	[svg, keys, container, font_ticks, font_label, height, width, margin] = self.init(data,target);


	_.pullAll(keys,['_id','DLI','T']);

	console.log(data);
	console.log(keys);

	margin.left*= 2.0;
	margin.right *= 0.8;
	var parseDate =  d3.timeParse("%Y-%m-%d-%H-%M");

	var x = d3.scaleTime().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink"]);

	
	y.domain([0, 2500.0]);

	x.domain(d3.extent(data,function(d){return parseDate(""+d._id.year+"-"+d._id.month+"-"+d._id.day+"-"+d._id.hour+"-"+d._id.minute) ; }));

	z.domain(keys);

	console.log(z.domain());
	
	var stack = d3.stack().keys(keys);
	var stacked = stack(data);

	
	console.log(stacked);

	var area = d3.area()
	    .curve(d3.curveMonotoneX)

	    .x(function(d){	
		return x( parseDate(""+d.data._id.year+"-"+d.data._id.month+"-"+d.data._id.day+"-"+d.data._id.hour+"-"+d.data._id.minute) ) + margin.left;
	    })
	    .y0(function(d) { return y(d[0]); })
	    .y1(function(d) { return y(d[1]); });

	var pathGroup = svg.append('g')
	    .attr("class","pathGroup")
	    .attr("transform","translate(0,"+margin.top+")")
	    ;
	
	pathGroup.selectAll('path.area2')
	    .data(stacked)
	    .enter()
	    .append('path')
	    .attr("class",function(d,i){return "area2 stack"+i;})
	    .attr("fill",function(d,i){
		console.log(d.key);
		return z(d.key);})
	    .attr("d",function(d){return area(d);});
	
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
	    .attr("y", 0 + margin.left - 60)
	    .attr("x",0 - (height - margin.top-margin.bottom)/2)
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
	    .style("font-size", font_label)
	    .text("PPFD (\u03BC mol/m\u00B2/s)");
	
	
	
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
	    right_scale:0.08,
	    bottom_scale:0.18,
	    left_scale:0.08,
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

	data.reverse();

//	console.log(keys);

//	console.log(key_index);

	/*
	
	console.log(container);
	console.log(font_ticks);
	console.log(font_label);
	console.log(height);
	console.log(width);
	console.log(margin);
*/


	
	var offsetY = height/2+margin.top;

	var offsetY2 = (height*0.75)+margin.top;

	data.forEach(function(d){
	    d.L = +d.L;
	});
	
	var parseDate = d3.timeParse('%Y-%m-%d-%H-%M-%S');

	var timezoneOffset = 3600000 * 5;



	var extentY = [0,2500];
	
	var extentX2 = d3.extent(data, function(d){return new Date((d.T*1000)+timezoneOffset);});

	var x2 = d3.scaleTime().range([0,width+margin.left]).domain(extentX2);

	var y = d3.scaleLinear().range([offsetY,0]).domain(extentY);
	var y3 = d3.scaleLinear().range([offsetY,0]).domain([0,30.0]);
	
	var height2 = height - offsetY2 - (margin.top*2);
	
	var y2 = d3.scaleLinear().range([height2, 0]).domain(extentY);

	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink","dodgerblue"]);

	keys = [keys[key_index[0]],keys[key_index[1]]];

	var stack = d3.stack().keys(keys);
	var stacked = stack(data);
	
	var x = d3.scaleTime().range([0,width+margin.left]).domain(x2.domain());

	var xAxis = d3.axisBottom(x);
	
	svg.append("defs").append("clipPath")
	    .attr("id","clip")
	    .append("rect")
	    .attr("height",height)
	    .attr("width",width-margin.left-margin.right)
	    .attr("x",margin.left)
	;


	var brush = d3.brushX()
	    .extent([[0,0],[width,height2]])
	    .on("brush end",brushed)
	;
	
	var brushEnd = x2(x2.domain()[1]) - margin.left - margin.right;
	var brushWidthFactor = 5;
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

	var area3 = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d,i){return x(new Date((d.T*1000 + timezoneOffset))); })
	    .y0(function(d){return y3(0); })
	    .y1(function(d){return y3(d.DLI); })
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
	/*

//==================================================================add in DLI to streamgraph
	pathGroupFocus.append("path")
	    .attr("class","area3")
	    .attr("fill",function(d,i){return "lightskyblue"; })
	    .attr("d",area3(data))
	;
	*/
	pathGroupFocus.selectAll(".areaZoom")
	    .data(stacked)
	    .enter().append("path")
	    .attr("class",function(d,i){return "areaZoom stack"+i;})
	    .attr("fill",function(d,i){return z(i); })
	    .attr("d",area)
	;
	
	pathGroupFocus.append("g")
	    .attr("class","axis axis--x x1")
	    .attr("transform","translate("+(0)+","+(offsetY)+")")
	    .call(xAxis)

	;


	svg.append("g")
	    .attr("class","axis axis--y")
	    .attr("transform","translate("+margin.left+","+margin.top+")")
	    .call(d3.axisLeft(y))
	;

	svg.append("text")
	    .attr("class","axis")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + margin.left - 60)
	    .attr("x",0 - offsetY/2 - margin.top)
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
	    .style("font-size", font_label)
	    .text("PPFD (\u03BC mol/m\u00B2/s)")
	;


	svg.append("g")
	    .attr("class","axis axis--y3")
	    .attr("transform","translate("+(width-margin.left)+","+margin.top+")")
	    .call(d3.axisRight(y3))
	;
	
	svg.append("text")
	    .attr("class","axis")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + width - margin.right + 30)
	    .attr("x",0 - offsetY/2 - margin.top)
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
	    .style("font-size", font_label)
	    .text("DLI (mol/m\u00B2/d)")
	;


	pathGroupContext.selectAll("path")
	    .data(stacked)
	    .enter().append("path")
	    .attr("class",function(d,i){return "areaZoom stack"+i;})
	    .attr("fill",function(d,i){return z(i); })
	    .attr("d",area2)
	;
	
	pathGroupContext.append("g")
	    .attr("class","axis axis--x x2")
	    .attr("transform","translate(0,"+(height2)+")")
	    .call(d3.axisBottom(x2))
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
	    
//=============================================================update context


	    var _extent = d3.extent(data,function(d){return d.T;});
	    var start = new Date(_extent[1]*1000+timezoneOffset);
	    var end = new Date(incoming_data[0].T*1000+timezoneOffset);
	    var transformContext = x2(end) - x2(start);

	    data = data.concat(incoming_data);	    
	    data.shift();
	    
	    stacked = stack(data);

	    x2.domain(d3.extent(data,function(d){return new Date(d.T*1000 + timezoneOffset); }));
	    	    
	    svg.select(".x2")
		.call(d3.axisBottom(x2))
	    ;
	    
	    pathGroupContext.selectAll(".areaZoom")
		.data(stacked)
		.attr("d",area2)
	    ;

	    pathGroupContext.attr("transform",null);
	    
	    var duration = 150;

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
		.call(d3.axisBottom(x))
	    ;
/*
	    pathGroupFocus.selectAll(".area3")
		.attr("d",area3)
	    ;
*/
	    
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
	function socket(){

	    var socket = io.connect("/");
	    
	    socket.on("connect",function(){
		setTitle("Connected");
	    });
	    
	    socket.on("disconnect",function(){
		setTitle("Disconnected");
	    });
	    
	    socket.on("update",function (incoming_data){
		
		
		tick(incoming_data);
		
	    });
	    
	    
	    function setTitle(title){
		$(".connected").text(title);
	    }
	    

 	}//socket();
*/
	
}

/*
    ,

    date_process(date){

//	console.log(date);
	var _date = {
	    year: parseInt(date.substring(0,4)),
	    month: parseInt(date.substring(4,6)),
	    month_indexed: parseInt(parseInt(date.substring(4,6))-1),
	    day: parseInt(date.substring(6,8)),
	    _month_indexed: ("0"+parseInt(parseInt(date.substring(4,6))-1)).slice(-2),
	    _day: ("0"+date.substring(6,8)).slice(-2)

	};
	_date.day365 = dateTo365.mathOnly(_date.year,_date.month,_date.day);
	_date.T = new Date(_date.year,_date.month,_date.day);
//	console.log(_date.T);
	return _date;
    }
*/
};
