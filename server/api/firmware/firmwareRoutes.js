var router = require('express').Router();
var fs = require('fs');
var tools = require('../../util/tools');
var compute = require("../../util/compute.js");
var controller = require('./firmwareController');

router.param('year',controller.param_year);

router.param('day',controller.param_day);

router.ws("/socket",controller.ws);

router.route('/datalogger/:year').post(controller.datalogger);

router.route('/day/:year/:day').get(controller.day);


module.exports = router;
