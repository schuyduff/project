var process = require('../../util/processData.js');
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
    Hour24: String,
    Sunrise: String,
    Sunset: String
    

});

dataSchema.index({T:1});
dataSchema.index({Day365:1});

if (!dataSchema.options.toObject) dataSchema.options.toObject = {};

dataSchema.options.toObject.transform = function (doc, ret, options) {
    // remove the _id of every document before returning the result
    delete ret._id;
    delete ret.__v;
    return ret;
};

dataSchema.statics.getLast = function(){
    return this.findOne().sort({T:-1}).lean().exec().then(function resolve(result){
	return result;
    },function reject(e){
	return e;
    });
};

dataSchema.statics.getMany = function(lookback,cb){

    return this.find({}).sort({T:-1}).limit(parseInt(lookback)).exec(cb);
};

dataSchema.statics.getToday = function(){

    var self = this;

    var group = {

	$group:{
	    
	    _id:{

		T:"$T",
		Year: "$Year",
		Month:"$Month",
		Day:"$Day365"
		
	    },

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

    return this.aggregate([group,sort,limit]).allowDiskUse(true).exec().then(function resolve(result){

//	console.log(result[0]._id);
	
//	var nextSunrise = Math.floor(process.getSunrise(result[0]._id).Sunrise.getTime()/1000);
//	console.log(nextSunrise);

//	console.log(result[0]._id.Day);

	
	var day = result[0]._id.Day - 0;
	
	day = (day>0) ? day: 1;
//	console.log("Day: %s",day);
	/*

	_result.Day = day;
	var sunrise = Math.floor(process.getSunrise(_result).Sunrise.getTime()/1000);
	console.log(sunrise);
*/
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
		    day: "$Day365",
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
	 

	return self.aggregate([match,group,sort]).allowDiskUse(true).exec().then(function resolve(result){	
//	return self.find({"Day365":day}).exec().then(function resolve(result){

	    return result;

	},function reject(err){

	    return err;
	    
	});
	
    }, function reject(err){

	return err;

    });

};


dataSchema.statics.getYesterday = function(){

    var self = this;

    var group = {

	$group:{
	    
	    _id:{

		T:"$T",
		Year: "$Year",
		Month:"$Month",
		Day:"$Day365"
		
	    },

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

    return this.aggregate([group,sort,limit]).allowDiskUse(true).exec().then(function resolve(result){

//	console.log(result[0]._id);
	
//	var nextSunrise = Math.floor(process.getSunrise(result[0]._id).Sunrise.getTime()/1000);
//	console.log(nextSunrise);

//	console.log(result[0]._id.Day);

	
	var day = result[0]._id.Day - 1;
	
	day = (day>0) ? day: 1;
//	console.log("Day: %s",day);
	/*

	_result.Day = day;
	var sunrise = Math.floor(process.getSunrise(_result).Sunrise.getTime()/1000);
	console.log(sunrise);
*/
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
		    day: "$Day365",
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
	 

	return self.aggregate([match,group,sort]).allowDiskUse(true).exec().then(function resolve(result){	
//	return self.find({"Day365":day}).exec().then(function resolve(result){

	    return result;

	},function reject(err){

	    return err;
	    
	});
	
    }, function reject(err){

	return err;

    });

};

module.exports = mongoose.model('testsin5', dataSchema);
