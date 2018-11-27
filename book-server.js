var socketio = require('socket.io'),
    url = require('url'),
    sys = require('sys'),
    express = require('express'),
    http = require('http'),
    path = require('path');


var app = express();
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/client.html'));
});
app.use(express.static(path.join(__dirname, '/public')));
var server = http.createServer(app);
var socket = socketio.listen(server);

server.listen(8080)
var io = socketio.listen(server);
io.sockets.on('connection', function (socket) {
    console.log("user connected");
});

var mysql = require('mysql');

var con = mysql.createConnection({
    host: "http://ec2-18-191-98-21.us-east-2.compute.amazonaws.com",
    port: "3306",
    user: "root",
    password: "qwerty"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});