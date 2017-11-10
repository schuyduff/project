var io = require("socket.io");
var $ = require(jQuery);
var socket = io("http://ec2-54-218-30-22.us-west-2.compute.amazonaws.com:80");

module.exports = function(callback){

    socket.on("disconnect", ()=>{

	setTitle("disconnected");
    });

    socket.on("connect",()=>{
	setTitle("Connected");
    });
    socket.on("message",(message)=>{
	setTitle(message);
    });

    function setTitle(title){
	document.querySelector("h1").innerHTML = title;
    }
    
};
