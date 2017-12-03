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

dataSchema.statics.getFullDay = function(lookback){

    
    var self = this;

    var group = {

	$group:{
	    
	    _id:{

		T:"$T",
		Sunrise:"$Sunrise"
	    }
	}
	
    };

    var sort = {

	$sort:{
	    T:-1
	}
	
    };

    var limit = {

	$limit:1

    };

    return this.aggregate([group,sort,limit]).exec().then(function resolve(result){
	
	var _sunriseNext = parseInt(result[0]._id.Sunrise-86400*lookback);
	var _sunrise = parseInt(result[0]._id.Sunrise)-86400*(lookback+1);

	var _match = {

	    $match:{
		T:{
		    $gt:_sunrise+61,
		    $lt:_sunriseNext
		}
	    }
	};

	var _group = {

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
	
	var _sort = {

	    $sort:{
		T:1
	    }
	};
	 
	

	return self.aggregate([_match,_group,_sort]).exec().then(function resolve(result){
	    return result;
	},function reject(e){
	    return e;
	});
	
    },function reject(e){
	return e;
    });


};



module.exports = mongoose.model('newsim', dataSchema);
