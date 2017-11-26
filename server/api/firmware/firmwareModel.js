var mongoose = require("mongoose");
var Schema = mongoose.Schema;
mongoose.Promise = require('bluebird');



var dataSchema = new Schema({

    T: Number,
    L: Number,
    LL: Number,
    R: Number,
    E: Number,
    D: Number,
    DLI: Number,
    Year: Number,
    Month: String,
    Day: String,
    Hour: String,
    Minute: String,
    Second: String,
    Day365: Number,
    Hour24: String

});

dataSchema.index({T:1});

dataSchema.statics.getLast = function(cb){
    return this.findOne().sort({T:-1}).exec(cb);
};

dataSchema.statics.getMany = function(lookback,cb){

    return this.find({}).sort({T:-1}).limit(parseInt(lookback)).exec(cb);
};

dataSchema.statics.getYesterday = function(cb){

    var self = this;

    var group = {

	$group:{
	    
	    _id:"$Day365",
	    count: {$sum:1}
	}
	
    };

    var sort = {

	$sort:{
	    "_id":-1
	}
	
    };

    var limit = {

	$limit:1

    };

    return this.aggregate([group,sort,limit]).exec().then(function resolve(result){

	var day = result[0]._id - 1;

	var match = {

	    $match:{
		Day365:day
	    }
	    
	};

	var group = {

	    $group:{

		_id:{

		    year: "$Year",
		    month: "$Month",
		    day: "$Day",
		    hour: "$Hour",
		    minute: "$Minute"

		},

		T:{
		    $avg:'$T'
		},
		
		L:{
		    $avg:'$L'
		},
		
		LL:{
		    $avg:'$LL'
		},
		
		DLI:{
		    
		    $avg:'$DLI'
		}
		
	    }
	    
	};
	
	var sort = {

	    $sort:{
		T:1
	    }
	};
	 

	return self.aggregate([match,group,sort]).exec().then(function resolve(result){	
//	return self.find({"Day365":day}).exec().then(function resolve(result){

	    return result;

	},function reject(err){

	    return err;
	    
	});
	
    }, function reject(err){

	return err;

    });

	

//    console.log(day);
    
//    return this.find({"Day365":day});
//    return this.find({}).sort({Day365:-1}).limit(parseInt(lookback));

    /*
    return new Promise(function(resolve,rejct){

	try{
	    var lookback = 1000;
	    //return resolve('hello!');
	    var query =  this.find({}).sort({T:-1}).limit(parseInt(lookback)).exec(cb);

	    return resolve(query);

	} catch(e){
	    return reject(e);
	}
    });
*/
};

module.exports = mongoose.model('testsin5', dataSchema);
