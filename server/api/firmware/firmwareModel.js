var mongoose = require("mongoose");
var Schema = mongoose.Schema;

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
//    console.log(lookback);
    return this.find({"Day":"01"}).sort({T:-1}).limit(parseInt(lookback)).exec(cb);
};

module.exports = mongoose.model('testsin3', dataSchema);
