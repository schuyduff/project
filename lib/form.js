var $ = require("jquery");

module.exports={

    date(){
	for(i=2015;i<2016;i++){
	    $('#_year_').append('<li><label for="'+i+'">'+i+'</label><input type="radio" checked id="'+i+'" name="year" value="'+i+'"></li>');
	}
	for (i=1; i<13;i++){
	    $('#_month_').append('<li><label for="'+i+'">'+i+'</label><input type="radio" checked id="'+i+'" name="month" value="'+i+'"></li>');
	}
	for (i=1; i<31;i++){
	    $('#_day_').append('<li><label for="'+i+'">'+i+'</label><input type="radio" checked id="'+i+'" name="day" value="'+i+'"></li>');
	}
    }

};
