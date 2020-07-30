'use strict';

var http = require("http");
var https = require("https");
var fs = require("fs");

var express = require("express");
var serveIndex = require("serve-index")

var socketIo = require("socket.io")
var log4js = require("log4js")

var logger = log4js.getLogger();
var app = express();
app.use(serveIndex("./public"));
app.use(express.static('./public'));

var http_server = http.createServer(app);
http_server.listen(8080, "0.0.0.0");

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
       var users = Object.keys(myRoom.sockets).length;
       logger.log("the number of user in room is: " + users);
       socket.emit('joined', room, socket.id);
       // socket.to(room).emit("joined", room, socket.id);
       // io.in(room).emit("joined", room, socket.id);
       // socket.broadcast.emit("joined", room, socket.id);
   });
    socket.leave('join', (room) => {
        socket.join(room);
        var myRoom = io.sockets.adapter.rooms[room];
        var users = Object.keys(myRoom.sockets).length;
        logger.log("the number of user in room is: " + users-1);
        socket.leave(room);
        // socket.to(room).emit("joined", room, socket.id);
        // io.in(room).emit("joined", room, socket.id);
        // socket.broadcast.emit("joined", room, socket.id);
    });
});

https_server.listen(8081, "0.0.0.0")
// var app = http.createServer(function (req, res) {
//     res.writeHead(200, {"Content-Type":"text/plain"});
//     res.end("nodejs Hello World\n")
// }).listen(8080, "0.0.0.0");