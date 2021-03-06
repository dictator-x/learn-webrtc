'use strict';

var http = require("http");
var https = require("https");
var fs = require("fs");

var express = require("express");
var serveIndex = require("serve-index")

var socketIo = require("socket.io")
var log4js = require("log4js")
var USERCOUNT = 3

var logger = log4js.getLogger();
logger.level = "debug";
var app = express();
app.use(serveIndex("./public"));
app.use(express.static('./public'));

// var host = "192.168.1.219"
var host = "127.0.0.1"

var http_server = http.createServer(app);
http_server.listen(8080, host);

var options = {
    key: fs.readFileSync("/home/dictator/work_space/webrtc_server/pem/localhost+2-key.pem"),
    cert: fs.readFileSync("/home/dictator/work_space/webrtc_server/pem/localhost+2.pem")
}
var https_server = https.createServer(options, app);
var io = socketIo.listen(https_server);

io.sockets.on('connection', function (socket) {
    socket.on('join', (room) => {
        socket.join(room);
        var myRoom = io.sockets.adapter.rooms[room];
        var users = (myRoom) ? Object.keys(myRoom.sockets).length : 0;
        logger.info("the number of user in room is: " + users);

        if ( users < USERCOUNT ) {
            socket.emit("joined", room, socket.id);
            if ( users > 1 ) {
                socket.to(room).emit("otherjoin", room, socket.id);
            }
        } else {
            socket.leave(room);
            socket.emit("full", room, socket.id);
        }

        // socket.emit('joined', room, socket.id);
        // socket.to(room).emit("joined", room, socket.id);
        // io.in(room).emit("joined", room, socket.id);
        //socket.broadcast.emit("joined", room, socket.id);
    });

    socket.on('leave', (room) => {
        var myRoom = io.sockets.adapter.rooms[room];
        var users = (myRoom) ? Object.keys(myRoom.sockets).length : 0;
        logger.info("the number of user in room is: " + users-1);
        socket.leave(room);
        socket.to(room).emit("bye", room, socket.id);
        socket.emit("leaved", room, socket.id);
        // socket.to(room).emit("joined", room, socket.id);
        // io.in(room).emit("joined", room, socket.id);
        // socket.broadcast.emit("joined", room, socket.id);
    });

    socket.on('message', (room, data)=>{
        socket.to(room).emit('message', room, data)//房间内所有人
        //socket.broadcast.emit("message", room, socket.id, data);
    });

});

https_server.listen(8081, host)
// var app = http.createServer(function (req, res) {
    //       res.writeHead(200, {"Content-Type":"text/plain"});
    //       res.end("nodejs Hello World\n")
    // }).listen(8080, "0.0.0.0");
