var $ = require("jquery");
var d3 = require("d3");
var _sun = require('suncalc');
var io = require('socket.io-client');

var compute = require("./compute.js");
var dateTo365 = require("./dateTo365.js");
var formatting = require('./formatting.js');
var async = require("async");



var self = module.exports = {

    

    main(){

	
 

	this.streamGraph("#stream-graph","./assets/datalogger/","",[1,2]);


	
    },

    streamGraph(target,prefix,suffix,key_index){

//	var input = "20151231";


	var now = new Date(2014,0,14);

	var timezoneOffset = 3600000*-5;

	var milliseconds = (now.getTime()+timezoneOffset);

	var millisecondsInDay = 86400000;

	var days = 5;

	var lookback = (milliseconds - (86400000)*days)/1000;

	
	
//	console.log(milliseconds);
	
	this.update(target,prefix,suffix,key_index, lookback);

	
    },
    
    update(target,prefix,suffix,key_index, milliseconds){
	
	
//	var date = this.date_process(input);
//	console.log(date);
//	console.log(milliseconds);
	
	var filepath = "" + prefix+ milliseconds;
	
//	var filepath = "" + prefix + date.year + ("000"+date.month).slice(-2) + date._day;
	
//	console.log(filepath);
	
	d3.json(filepath).get((data)=>{
	    
	    //this.draw(data, container, key_index, date, daily,init);

	    switch(target){

	    case"#stream-graph":
		console.log("ran stream graph");
//		console.log(data);
		this.draw_stream_graph(data,target,key_index);

	    }
	    
	});

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
	    bottom_scale:0.18,
	    left_scale:0.05,
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


	
	console.log(data);
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

	console.log("width: "+width);
	
	var offsetY = height/2+margin.top;

	var offsetY2 = (height*0.75)+margin.top;

	data.forEach(function(d){
	    d.L = +d.L;
	});
	
	var parseDate = d3.timeParse('%Y-%m-%d-%H-%M-%S');

	var timezoneOffset = 3600000 * 5;



//===========================================================before data slice

	var extentY = [0,2500];
	
	var extentX2 = d3.extent(data, function(d){return new Date((d.T*1000)+timezoneOffset);});

	var x2 = d3.scaleTime().range([0,width+margin.left]).domain(extentX2);

	var y = d3.scaleLinear().range([offsetY,0]).domain(extentY);



	
	var height2 = height - offsetY2 - (margin.top*2);
	
	var y2 = d3.scaleLinear().range([height2, 0]).domain(extentY);

	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink"]);

	

	var _keys = [keys[key_index[0]],keys[key_index[1]]];

	var stack = d3.stack().keys(_keys);
	var stacked = stack(data);






//============================================================after data slice	

	var lookback = -48;
	
	var days = 1;

	var millisecondsInDay = 86400000;
	

	var indices = data.length-1-49;
	
	var data2 = data.slice(lookback*days);	
	
	var extentX = d3.extent(data2, function(d){ return new Date((d.T*1000)+timezoneOffset);});

//	console.log(extentX);
	
	var x = d3.scaleTime().range([0,width +margin.left]).domain(x2.domain());

	var xAxis = d3.axisBottom(x);

	var stacked2 = stack(data2);



//	console.log(stacked);
//	console.log(stacked2);

	
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

	var zoom = d3.zoom()
	    .scaleExtent([1, Infinity])
	    .translateExtent([[0,0],[width,height]])
	    .extent([[0,0],[width,height]])
	    .on("zoom",zoomed)
	;


	var area = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d) { return x(new Date((d.data.T*1000 + timezoneOffset))); })	
	    .y0(function(d){ return y(d[0]); })
	    .y1(function(d){ return y(d[1]); })

	;

	var area2 = d3.area()
	    .curve(d3.curveMonotoneX)
	    .x(function(d,i){ return x2(new Date((d.data.T*1000 + timezoneOffset))); })
	    .y0(function(d){return y2(d[0]); })
	    .y1(function(d){return y2(d[1]); })
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
	
	pathGroupFocus.selectAll("path")
	    .data(stacked)
	    .enter().append("path")
	    .attr("class",function(d,i){return "areaZoom stack"+i;})
	    .attr("fill",function(d){return z(d.key); })
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

	

	pathGroupContext.selectAll("path")
	    .data(stacked)
	    .enter().append("path")
	    .attr("class",function(d,i){return "areaZoom stack"+i;})
	    .attr("fill",function(d){return z(d.key); })
	    .attr("d",area2)
	;
	
	pathGroupContext.append("g")
	    .attr("class","axis axis--x x2")
	    .attr("transform","translate(0,"+(height2)+")")
	    .call(d3.axisBottom(x2))
	;


	
	var brushEnd = x2(x2.domain()[1]) - margin.left - margin.right;
	
	var brushBegin = x2(new Date(x2.domain()[1].getTime()-(millisecondsInDay*days)));
	
	
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
	    
	

	var brushExtent;
	
	function brushed(){


	    if(d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return ;// ignore brush-by-zoom

	    
	    var s = d3.event.selection || x2.range();
	    
//	    s[1]+= (margin.right);

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

//	    pathGroupFocus.interrupt().selectAll("*").interrupt();
	    
	    var t = d3.event.transform;
	    
	//    console.log(t);
	    
	    x.domain(t.rescaleX(x2).domain());

	    d3.select(".x1").call(d3.axisBottom(x));
	    
	    pathGroupFocus.selectAll(".areaZoom")
		.data(stacked)
		.attr("d",area)
	    ;



	    //	    context.select(".brush").call(brush.move,x.range().map(t.invertX,t));

	    var brushPosition = x.range().map(t.invertX,t);

//	    brushPosition[1] = ((width - (margin.right*3)) / width ) * brushPosition[1];
	    
	    brushExtent = brushPosition;
	    
	    context.select(".brush").call(brush.move,brushPosition);
	}

	
	function tick(incoming_data){
	    
	    console.log(incoming_data);

//=============================================================update context

	    var start = new Date(data[data.length-1].T*1000+timezoneOffset);
	    var end = new Date(incoming_data.T*1000+timezoneOffset);
	    var transformContext = x2(end) - x2(start);
	    
	    data = data.concat(incoming_data);	    
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
	    
	    var duration = 1000;
	    var t = d3.transition().duration(duration).ease(d3.easeLinear);

		pathGroupContext
		    .transition(t)
	    	    .attr("transform","translate("+(-1*transformContext)+",0)")

	    ;

//=============================================================update focus


	    var pixels = brushExtent[1] + transformContext;

	    var date = x2.invert(pixels);
	    
	    var transformFocus = x(date) - x(x2.invert(brushExtent[1]));
	    

	    
	    console.log(transformFocus);

	    x.domain(brushExtent.map(x2.invert, x2));	    

	    svg.select(".x1")
		.call(d3.axisBottom(x))
	    ;

	    pathGroupFocus.selectAll(".areaZoom")
		.data(stacked)
		.attr("d",area)
	    ;

	    pathGroupFocus.attr("transform",null);

	    var t2 = d3.transition().duration(duration).ease(d3.easeLinear);
	    
	    pathGroupFocus
		.transition(t)
		.attr("transform","translate("+(-1*transformFocus)+",0)")

	    ;

	    data.shift();


	}



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
	    

	}socket();

	
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
