
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cors = require("cors");
var _static = require('express').static;

module.exports = function(app){
    app.use(morgan('dev'));
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(bodyParser.json());
    app.use(cors());
    app.use(_static("./public"));
    app.use(function(req, res, next) {
	console.log(`\n${req.method} request for '${req.url}' ---- ${JSON.stringify(req.body)}\n`);
	next(); 
    });
};
