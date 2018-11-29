var socketio = require('socket.io'),
  url = require('url'),
  sys = require('sys'),
  express = require('express'),
  http = require('http'),
  session = require('express-session'),
  path = require('path');


var app = express();
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/client.html'));
});
app.use(express.static(path.join(__dirname, '/public')));
//app.use(session({
// secret: 'poopy',
// resave: false,
// saveUninitialized: false,
// cookie: {}
//}));
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


var minutes = 1;
var interval = minutes * 60 * 1000;
interval = minutes * 1000;
var machineStarted = false;

server.listen(8080)
var io = socketio.listen(server);
io.sockets.on('connection', function (socket) {
  console.log("user connected");
  if (machineStarted == false) {
    machineStarted = true;
    setInterval(function () {
      console.log("I am doing my 1 second check");
      io.emit("state-change");
    }, interval);
  } else {
    console.log("game already started");
  }

  socket.on('register-attempt', function (data) {
    console.log("register attempt, " + data["username"] + ", " + data["password"]);
    var username = data["username"];
    var password = data["password"];
    sql.query('SELECT username FROM users WHERE username = ?', username, function (err, result, fields) {
      if (result.length > 0) {
        console.log("error: username '" + username + "' is already taken");
        socket.emit('server-message', {
          message: "user already exists"
        });
      } else {
        sql.query("INSERT INTO users (username, password, votes, bio) VALUES ('" + username + "', '" + password + "', 0, 'user has not set bio')", function (err, result) {
          if (err) throw err;
          console.log("1 user registered, successfully entered into table users");
        });
      }
    });
  });

  socket.on('login-attempt', function (data) {
    console.log("login attempt, " + data["username"] + ", " + data["password"]);
    var username = data["username"];
    var password = data["password"];
    sql.query('SELECT username, password FROM users WHERE username = ?', username, function (err, result, fields) {
      if (result.length > 0) {
        socket.emit('server-message', {
          message: "successfully logged in"
        });
        socket.emit('login-successful');
      } else {
        console.log("error: login failed, user doesn't exist");
        socket.emit('server-message', {
          message: "user doesn't exist"
        });
      }
    });
  });

});