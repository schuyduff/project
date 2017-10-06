var $ = require("jquery");

module.exports={

    date(){
	for(i=2015;i>1998;i--){
	    $('#selectYear').append('<option>'+i+'</option>');
	}

	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October','November', 'December'];


	months.forEach(function(item,index){
	 //   console.log(index);
	    $('#selectMonth').append('<option value="'+index+'">'+item+'</option>');
	});

	for(i=1;i<32;i++){
	    $('#selectDay').append('<option>'+i+'</option>');
	}

    }
    

};
