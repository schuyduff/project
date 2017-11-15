var _ = require("lodash");

var config = {

    dev: 'development',
    stag: 'staging',
    prod: 'production',
    port: process.env.PORT || 8080,
    mongoUri: process.env.MONGODB_URI || "mongodb://ds159235.mlab.com:59235/data",
    db: {
	url:'mongodb://localhost/data'
    }
};

process.env.NODE_ENV = process.env.NODE_ENV || config.dev;

config.env = process.env.NODE_ENV;

var envConfig;

try {
    
    envConfig = require('./'+config.env);
    envConfig = envConfig || {};

    
}
catch (e){

    envConfig = {};
}






module.exports = _.merge(config, envConfig);
