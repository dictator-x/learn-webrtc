"use strict"
var https = require("https");
var fs = require("fs");
var options = {
    key: fs.readFileSync("./cert/www_xrw_io.pem"),
    cert: fs.readFileSync("./cert/www_xrw_io.crt")
}

var app = https.createServer(options, function(req, res){
    res.writeHead(200, {"Context-Type": "text/plain"});
    res.end("Hello WOrld");
}).listen(443, "0.0.0.0");
