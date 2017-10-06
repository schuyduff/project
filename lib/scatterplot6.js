var $ = require("jquery");
var d3 = require("d3");
var _sun = require('suncalc');


var compute = require("./compute.js");
var dateTo365 = require("./dateTo365.js");
var formatting = require('./formatting.js');
var async = require("async");
var self = module.exports = {


    main(){
	this.chartAnnual('#annual',"./assets/",".json", [2,3]);

	this.chartDaily("#daily","./assets/","_PPFD_half_hourly.json", [8,7]);
	
	this.chartAnnual('#annual-lassi',"./assets/",".json", [2,4]);

	this.chartDaily("#daily-lassi","./assets/datalogger/",".json",[10,1,2]);

	
    },
    
    chartAnnual(target,prefix,suffix,key_index){

	var input = "20150001";
	
	$('#selectYear').on('input',(event)=>{

	    
	    var year = event.currentTarget.value;
	    
	    var month =  ("000"+$('#selectMonth').val()).slice(-2);
	    
	    var day = ("000"+$('#selectDay').val()).slice(-2);
	    
	    this.update_text(year,month,day);
	    
	    input = ""+year+month+day;

//	    console.log(input);
	    
	    this.update(target,prefix,suffix,input, key_index);
//	    this.update(input,"./assets/","_PPFD_half_hourly.json",'#daily', [8,7], true);
 
	});

	this.update(target,prefix,suffix,input,key_index);

    },
    
    chartDaily(target, prefix, suffix, key_index){

	var input = "20150001";
	
	$('#selectMonth').on('input',(event)=>{

	    var year  = $('#selectYear').val();
	    
	    var month = ("000"+event.currentTarget.value).slice(-2);
			     
	    var day = ("000"+$('#selectDay').val()).slice(-2);
	    
	    this.update_text(year,month,day);
	    
	    input = ""+year+month+day;

	    d3.selectAll('.active')
		.attr("class",function(d,i){ return "D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);})
		.attr("r","2");

	    d3.selectAll(".D"+month+day).attr("class","active").attr("r","10");

	    console.log(input);
	    
	    this.update(target,prefix,suffix,input,key_index);
	    
	});

	$('#selectDay').on('input',(event)=>{

	    var year  = $('#selectYear').val();
	    
	    var month = ("000"+$('#selectMonth').val()).slice(-2);

	    var day = ("000"+event.currentTarget.value).slice(-2);

	    this.update_text(year,month,day);
	    
	    input = ""+year+month+day;

	    d3.selectAll('.active')
		.attr("class",function(d,i){ return "D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);})
		.attr("r","2");
	    
	    d3.selectAll(".D"+month+day).attr("class","active").attr("r","10");

	    
	    this.update(target,prefix,suffix,input,key_index);



	});
	this.update(target,prefix,suffix,input,key_index);
	




    },
    
    handleMouseOver(d,i,elem,data){
	console.log("ran mouseover");
/*
	d3.selectAll('.active')
	    .attr("r","2")
	    .attr("class","D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2));

	d3.select(elem)
	    .attr("r","10")
	    .attr("class","active");
*/
	var year = $('#selectYear').val();
	var month = ("000"+d.Month).slice(-2);
	var day = ("000"+d.Day).slice(-2);

	this.update_text(year,month,day);

	var input = ""+year+month+day;

	var date = this.date_process(input);



	d3.selectAll('.active')
	    .attr("r","2")
	    .attr("class",function(d){return "D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);});
	
	d3.selectAll(".D"+month+day).attr("class","active").attr("r","10");
	
	this.update("#daily","./assets/","_PPFD_half_hourly.json",input,[8,7]);
	this.update("#daily-lassi","./assets/datalogger/",".json",input,[10,1,2]);
/*
	this.update(input,"./assets/","_PPFD_half_hourly.json","#daily", [8,7], true);
	this.update(input,"./assets/datalogger/",".json","#daily_lassi", [10,1,2], true);
*/	
    },


    update_text(year, month, day){

	var prefix = "Irradiance for ";
	var prefix2 = "Irradiance + Lassi for ";
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	month = parseInt(month);
	//console.log(months[month]);
	day = parseInt(day);
	$('.label-annual').text(prefix+year);
	$('.label-day').text(prefix+ months[month] +" "+day);

	$('.label-annual-lassi').text(prefix2+year);
	$('.label-daily-lassi').text(prefix2+ months[month] +" "+day);
    },
    
    update(target,prefix,suffix,input,key_index, daily,init){
	
	
	var date = this.date_process(input);
//	console.log(date);
	var filepath = "" + prefix + date.year + suffix;
	
	d3.json(filepath).get((data)=>{
	    
	    //this.draw(data, container, key_index, date, daily,init);

	    switch(target){

	    case "#annual":
		console.log("ran annual");
		this.draw_annual(data,target,key_index,date);
		break;

		
	    case "#daily":
		console.log("ran daily");
		this.draw_daily(data,target,key_index,date);
		break;

	    case "#annual-lassi":
		console.log("ran annual-lassi");
		this.draw_annual(data,target,key_index,date);
		break;

	    case "#daily-lassi":
		console.log("ran annual-daily");
		this.draw_daily_lassi(data,target,key_index,date);
		break;

	    }
	    
	});

    },

    init(data,target){
	
	var keys = d3.keys(data[0]);

        var container = target;

	var svgtest = d3.select(container).select('svg').selectAll(".points, .axis, .text, text.legend");

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

	[svg, keys, container, font_ticks, font_label, height, width, margin] = this.init(data,target);
/*
	console.log(data);
        console.log(keys);
        console.log(container);
        console.log(font_ticks);
        console.log(font_label);
        console.log(height);
        console.log(width);
        console.log(margin);
*/	

	var parseDate =  d3.timeParse("%Y-%j");

	var x = d3.scaleTime().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink"]);
			
	y.domain([0, d3.max(data, function(d) { return d[keys[key_index[1]]]; })]);

	x.domain(d3.extent(data,function(d){return parseDate(""+date.year+"-"+d[keys[key_index[0]]]) ; }));	


	data.forEach(function(d) {
	    d[keys[key_index[0]]] = +d[keys[key_index[0]]];
	    d[keys[key_index[1]]] = +d[keys[key_index[1]]];
	
	});

	
	svg.append("g")
	    .attr("class","points")
	    .selectAll("g")
	    .data(data)
	    .enter()
	    .append('circle')
	
	    .attr("r", 2)
	    .attr("transform", "translate("+(margin.left)+","+(margin.top)+")")
	    .attr("cx", function(d) { return x(parseDate(""+date.year+"-"+d[keys[key_index[0]]])); })
	    .attr("cy", function(d) { return y(d[keys[key_index[1]]]); })
	    .attr("class",function(d,i){
		
		return (d.Month == date.month && d.Day == date.day)?"active":"D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);
	    })
	    .attr("r",function(d,i){
		return (d.Month == date.month && d.Day == date.day)?"10":"2";
	    })
	
	    .on("mousemove",function(d,i){

		
		var elem = this;

		
		self.handleMouseOver(d,i,elem);
		
	    });
	
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

    draw_daily(data,target,key_index,date){

	var svg, keys, container, font_ticks, font_label, height, width, margin;

	[svg, keys, container, font_ticks, font_label, height, width, margin] = this.init(data,target);

/*
	console.log(data);
        console.log(keys);
        console.log(container);
        console.log(font_ticks);
        console.log(font_label);
        console.log(height);
        console.log(width);
        console.log(margin);
*/
	//var parseDate =  d3.timeParse("%Y-%m-%d-%H-%M");

	var x = d3.scaleTime().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink"]);
			

	y.domain([0, d3.max(data, function(d) { return d[keys[key_index[1]]]; })]);

	data = this.select_day(data,date);

	data.forEach(function(d) {
	    d[keys[key_index[0]]] = +d[keys[key_index[0]]];
	    d[keys[key_index[1]]] = +d[keys[key_index[1]]];
	
	});
	
	x.domain(d3.extent(data,function(d){ return new Date(d.T*1000); }));	

	var area = d3.area()
	    .x(function(d){ return x(new Date(d.T*1000)) + margin.left; })
	    .y0(height-margin.bottom)
	    .y1(function(d) { return y(d[keys[key_index[1]]])+margin.top; });
	
	svg.select('path.area')
	    .transition()
	    .duration(250)
	    .attr("d",area(data));
	
	if(svg.select('path.area').empty()){
	    
	    svg.append('path')
		.attr('d', area(data))
		.attr("class","area");
	    
	    
	}
		
	var DLI = data.reduce(function(sum,value){
			
	    return sum + value[keys[key_index[1]]];

	    },0);
	    
	    DLI = DLI*1800/1000000;
	    DLI = DLI.toFixed(2);

	    svg.append("text")
		.attr("class","legend")
		.attr("transform","translate("+(width - margin.right) +","+(margin.top+(margin.bottom/2))+")")
		.style("font-size",font_label)
		.attr("text-anchor","end")
		.text(DLI+" mol/m\u00B2/d");

	
	
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

	x.domain(d3.extent(data,function(d){ return new Date(d.T*1000); }));	

	var _keys = [keys[key_index[1]],keys[key_index[2]]];
	
	z.domain(_keys);
	
	var stack = d3.stack().keys(_keys);
	
	var area2 = d3.area()
	
	    .x(function(d){return x(new Date(d.data.T*1000))+margin.left;})
	    .y0(function(d){return y(d[1])+margin.top;})
	    .y1(function(d){return y(d[0])+margin.top;});
	
	
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

	    
	    var DLI = data.reduce(function(sum,value){

		    return sum + value[keys[key_index[1]]]+value[keys[key_index[2]]];

	    },0);
	    
	    DLI = DLI*1800/1000000;
	    DLI = DLI.toFixed(2);
//	    console.log(DLI);

	    svg.append("text")
		.attr("class","legend")
		.attr("transform","translate("+(width - margin.right) +","+(margin.top+(margin.bottom/2))+")")
		.style("font-size",font_label)
		.attr("text-anchor","end")
		.text(DLI+" mol/m\u00B2/d");




	
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
  /*  
    draw(data, _container, key_index, date, daily,init){

	var keys = d3.keys(data[0]);

	console.log(keys);
	console.log(keys[key_index[0]]);
	console.log(keys[key_index[1]]);
	console.log(keys[key_index[2]]);

	var container = _container; 
	
	var svgtest = d3.select(container).select('svg').selectAll(".points, .axis, .text, text.legend");

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
	


	data.forEach(function(d) {
	    d[keys[key_index[0]]] = +d[keys[key_index[0]]];
	    d[keys[key_index[1]]] = +d[keys[key_index[1]]];
	
	});

	
	var parseDate = (daily) ? d3.timeParse("%Y-%m-%d-%H-%M") : d3.timeParse("%Y-%j");

	var x = d3.scaleTime().range([0,width-margin.left-margin.right]);
	var y = d3.scaleLinear().range([height-margin.top-margin.bottom, 0]);
	var z = d3.scaleOrdinal().range(["LightGrey", "HotPink"]);
			
	y.domain([0, d3.max(data, function(d) { return d[keys[key_index[1]]]; })]);

	
	if (daily){

	    data = this.select_day(data,date);
	    console.log(container);
	    console.log(data);

	    x.domain(d3.extent(data,function(d){ return new Date(d.T*1000); }));

	    if (keys[key_index[2]]){

		var _keys = [keys[key_index[1]],keys[key_index[2]]];

		z.domain(_keys);

		var stack = d3.stack().keys(_keys);
		
		var area2 = d3.area()

		    .x(function(d){return x(parseDate(date.year+"-"+(("000"+(d.data.Month+1)).slice(-2))+"-"+d.data.Day+"-"+d.data.Hour+"-"+d.data.Minute))+margin.left;})
		    .y0(function(d){return y(d[1])+margin.top;})
		    .y1(function(d){return y(d[0])+margin.top;});

		
		var stacked = stack(data);
		
		svg.selectAll('.area2')
		    .data(stacked)
		    .transition()
		    .duration(250)
		    .attr("d",function(d){return area2(d);});
		
		
		if(init){
		    
		    svg.selectAll('path')
			.data(stacked)
			.enter()
			.append('path')
			.attr("class",function(d,i){return "area2 stack"+i;})
			.attr("fill",function(d){return z(d.key);})
		    
			.attr("d",function(d){return area2(d);});
		    
		}
		
	    } else {

		var area = d3.area()
		    .x(function(d){ return x(parseDate(date.year+"-"+(("000"+(d.Month+1)).slice(-2))+"-"+d.Day+"-"+d.Hour+"-"+d.Minute)) + margin.left; })
		    .y0(height-margin.bottom)
		    .y1(function(d) { return y(d[keys[key_index[1]]])+margin.top; });

		svg.select('path.area')
		    .transition()
		    .duration(250)
		    .attr("d",area(data));
		
		if(init){

		    svg.append('path')
			.attr('d', area(data))
			.attr("class","area");


		    
		}

	    }
	    
	    var DLI = data.reduce(function(sum,value){

		if (keys[key_index[2]]){

		    return sum + value[keys[key_index[1]]]+value[keys[key_index[2]]];

		} else {

		    return sum + value[keys[key_index[1]]];

		}

	    },0);
	    
	    DLI = DLI*1800/1000000;
	    DLI = DLI.toFixed(2);
//	    console.log(DLI);

	    svg.append("text")
		.attr("class","legend")
		.attr("transform","translate("+(width - margin.right) +","+(margin.top+(margin.bottom/2))+")")
		.style("font-size",font_label)
		.attr("text-anchor","end")
		.text(DLI+" mol/m\u00B2/d");

	}


	if(!daily){	

	    x.domain(d3.extent(data,function(d){return parseDate(""+date.year+"-"+d[keys[key_index[0]]]) ; }));	

//	    console.log(data);

	    svg.append("g")
		.attr("class","points")
		.selectAll("g")
		.data(data)
		.enter()
		.append('circle')
	    
		.attr("r", 2)
		.attr("transform", "translate("+(margin.left)+","+(margin.top)+")")
		.attr("cx", function(d) { return x(parseDate(""+date.year+"-"+d[keys[key_index[0]]])); })
		.attr("cy", function(d) { return y(d[keys[key_index[1]]]); })
		.attr("class",function(d,i){

		    return (d.Month == date.month && d.Day == date.day)?"active":"D"+("000"+d.Month).slice(-2)+("000"+d.Day).slice(-2);
		})
		.attr("r",function(d,i){
		    return (d.Month == date.month && d.Day == date.day)?"10":"2";
		})
	    
		.on("mousemove",function(d,i){

		    if(!daily){

			var elem = this;

			
			self.handleMouseOver(d,i,elem);
			
		    }
		});

	    

	}

	
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
*/
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
    },
    
    select_day(data,date){
	
	var day = date.day365;	
//	console.log(date);
	var _date = new Date(date.year, date.month, date.day);
	
	var lat = 42;
	var long = -76;

	var sun = _sun.getTimes(_date,lat,long);
	var timeZoneOffset = 3600000;
	var round_down = (sun.sunrise.getMinutes()*60000)+(sun.sunrise.getSeconds()*1000)+1000;

	var sunrise = new Date(sun.sunrise.getTime()+(timeZoneOffset*24)-round_down);
	var sunrise_next = new Date(sun.sunrise.getTime()+(timeZoneOffset*48)-round_down);
	
	data = data.filter(function(item,index){

	    var __date = new Date(item.Year, item.Month, item.Day, item.Hour, item.Minute);

	    return (__date >= sunrise && __date < sunrise_next); 

	});

	//	console.log(data);

	return data; 
    }

};
