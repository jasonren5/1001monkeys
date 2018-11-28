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

var mysql = require('mysql');

var sql = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "qwerty",
  database: "1001monkeys"
});

sql.connect(function (err) {
  if (err) throw err;
  console.log("MySQL Connected!");
});

server.listen(8080)
var io = socketio.listen(server);
io.sockets.on('connection', function (socket) {
  console.log("user connected");

  socket.on('register-attempt', function (data) {
    var username = data["username"];
    var password = data["password"];
    sql.query('SELECT USERNAME FROM users WHERE username = ?', username, function (err, result, fields) {
      if (result.length() > 0) {
        socket.emit('user-exists');
      } else {
        sql.query('INSERT INTO users (username, password, votes, bio) VALUES (' + username + ', ' + password + ', 0, "user has not set bio")', function (err, result) {
          if (err) throw err;
          console.log("1 user registered, successfully entered into table users");
        });
      }
    });
  });


});

