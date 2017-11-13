var $ = require("jquery");
var d3 = require("d3");
var bootstrap = require("./less/bootstrap/dist/js/bootstrap.js");
var scatterplot6 = require("./server/util/scatterplot6.js");
var streamGraph = require("./server/util/streamGraph.js");
var io = require('socket.io-client');
var form = require("./server/util/form.js");
//var visibility = require('visibilityjs');

$(document).ready(function(){


    
    
    form.date();
    scatterplot6.main();


  //  console.log(visibility.state());
    

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
