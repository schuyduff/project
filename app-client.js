var $ = require("jquery");
var d3 = require("d3");
var bootstrap = require("./less/bootstrap/dist/js/bootstrap.js");
var scatterplot6 = require("./lib/scatterplot6.js");
var streamGraph = require("./lib/streamGraph.js");
var io = require('socket.io-client');
var form = require("./lib/form.js");


$(document).ready(function(){
   
    form.date();
    scatterplot6.main();
    streamGraph.main();










    /*
    var host = location.origin.replace(/^http/,"ws");
    
    var ws = new WebSocket(host+"/web");

    
    ws.onopen = function(){
	console.log("Websocket Connected!");
    };

    
    ws.onmessage = function(payload){

	console.log(payload);
	
    };
    */
    
/*    
    var id = setInterval(function(){
	ws.send("d");
	
    },1000);
*/
    
});
