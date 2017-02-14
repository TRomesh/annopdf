var express = require("express");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var aws = require('aws-sdk');

var lines=[];

aws.config.update({
 region:"us-east-2",
});

app.use('/static', express.static('assets'));



app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('updatelines',function(msg){
    if(msg){lines=msg;}
    socket.broadcast.emit('updatelines',msg);
  });

  socket.on('readyforline',function(msg){
    socket.emit('updatelines',lines);
  });

  socket.on('updatetransform',function(msg){
    socket.broadcast.emit('updatetransform',msg);
  });
});





http.listen(33333, function(){
  console.log('listening on *:33333');
});
