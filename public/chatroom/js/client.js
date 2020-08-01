"use strict"

var username = document.querySelector("input#username");
var inputRoom = document.querySelector("input#room");
var btnConnect = document.querySelector("button#connect");
var outputArea = document.querySelector("textarea#output");
var inputArea = document.querySelector("textarea#input");
var btnSend = document.querySelector("button#send");

var socket;
var room;

btnConnect.onclick = function() {
    socket = io.connect();
    socket.on("joined", function(room, id) {
        btnConnect.disabled = true;
        inputArea.disabled = false;
        btnSend.disabled = false;
    })
    socket.on("leaved", function(room, id){
        btnConnect.disabled = false;
        inputArea.disabled = true;
        btnSend.disabled = true;
    })
    socket.on("message", function(room, id, data) {
        outputArea.value = outputArea.value + data + "\r";
    })

    room = inputRoom.value;
    socket.emit("join", room);
}

btnSend.onclick = function() {
    console.log("aaa")
    var data = inputArea.value;
    data = username.value + ":" + data;
    socket.emit("message", room, data)
    inputArea.value = "";
}