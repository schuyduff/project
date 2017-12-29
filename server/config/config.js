var _ = require("lodash");

var config = {

    dev: 'development',
    stag: 'staging',
    prod: 'production',
    bin: 'binary',
    port: process.env.PORT || 8080,
    db: {
	url: process.env.MONGODB_URI || 'mongodb://localhost/data',
	collection: 'friday'
	
    },

    particle:{
	user: process.env.PARTICLE_USER,
	pass: process.env.PARTICLE_PASS,
	binary: '4b0044000151353532373238',
	modulation:'300018001747343438323536'
    },
    backup: true
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
