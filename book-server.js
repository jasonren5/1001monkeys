var socketio = require('socket.io'),
    url = require('url'),
    sys = require('sys'),
    express = require('express'),
    http = require('http'),
    path = require('path');


var app = express();
app.get('/', function(req, res) {
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
  host: "localhost",
  user: "yourusername",
  password: "yourpassword"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
