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
//TODO: sessions?
//app.use(session({
// secret: 'poopy',
// resave: false,
// saveUninitialized: false,
// cookie: {}
//}));
var server = http.createServer(app);
var socket = socketio.listen(server);

var mysql = require('mysql');
//prepares the connection to the SQL server
var sql = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "qwerty",
    database: "1001monkeys"
});

//connects to the SQL server
sql.connect(function (err) {
    if (err) throw err;
    console.log("MySQL Connected!");
});


var minutes = 1;
var interval = minutes * 30 * 1000;
var machineStarted = false;
var serverState = false;
//state: false = accepting submissions, true = accepting votes

server.listen(8080)
var io = socketio.listen(server);
io.sockets.on('connection', function (socket) {


    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    if (day < 10) {
        day = '0' + day
    }
    if (month < 10) {
        month = '0' + month
    }
    date = month + '-' + day + '-' + year;
    //need to give user current book for the day
    sql.query("SELECT text FROM books WHERE date = ?", date, function (err, result) {
        if (err) throw err;
        console.log('user detected, emitting book of the day');
        if (result.length > 0) {
            console.log("today's book text: " + result[0].text);
            io.emit('give-current-book', {
                text: result[0].text
            });
        }
    });
    //socket.emit('give-current-book',)

    console.log("user connected");
    //only begins the timer for the room if the timer has not been started
    //  (timer/interval first starts when the first user connects)
    //  essentially a finite state machine that transitions between 2 states on time,
    //    with one state being acceptng submissions, and another state being
    //    accepting votes, with the submission with the highest vote being appended
    //    to the book when the state transitions back to accepting submissions
    if (machineStarted == false) {
        machineStarted = true;
        setInterval(function () {
            //toggles the state of the server
            serverState = !serverState;

            //if transitioning to submission state
            if (!serverState) {
                console.log("serverState is now going back to submissions.");
                //TODO select all from submissions, find submission with highest votes, and then return that in emit
                sql.query("SELECT * FROM submissions", function (err, result, fields) {
                    if (err) throw err;
                    //insertRow tracks the row with the highest amount of votes so that it can be appended to the book
                    var insertRow = '';
                    var highestVotes = -1;
                    var submission = '';
                    //if submissions are recieved
                    if (result.length > 0) {
                        for (var i = 0; i < result.length; i++) {
                            if (result[i].votes >= highestVotes) {
                                insertRow = result[i];
                                highestVotes = result[i].votes;
                            }
                        }
                        sql.query("INSERT INTO accepted_submissions (subid, uid, votes, text) VALUES (" + insertRow.subid + ", " + insertRow.uid + ", " + insertRow.votes + ", '" + insertRow.text + "')", function (err) {
                            console.log("attempting to add into accept");
                            if (err) throw err;
                            console.log("submission successfully added to accepted_submissions");
                        });
                        submission = insertRow.text;
                    } else {
                        console.log("no submissions recieved, i guess");
                    }

                    //end voting procedure
                    io.emit('end-voting', {
                        submission: submission
                    });


                    sql.query("SELECT * FROM books WHERE date = ?", date, function (err, results, fields) {
                        if (err) throw err;
                        if (results.length == 0) {
                            sql.query("INSERT INTO books (date, text) VALUES ('" + date + "', '" + submission + "');", function (err) {
                                console.log("attempted to create a book");
                                if (err) throw err;
                                console.log("first submission of the day; book successfully created");
                            });
                        } else {
                            sql.query("UPDATE books SET text = CONCAT(text, '" + submission + "') where date = '" + date + "';", function (err) {
                                console.log("attempting to update a book");
                                if (err) throw err;
                                console.log("book successfully updated");
                            });
                        }
                    });

                    //clear the submissions table
                    console.log("submission: " + submission);
                    sql.query("DELETE FROM submissions;");
                    console.log("deleting everything from submissions");
                });
            } else {
                //if transitioning into voting. Need to select all submissions, and pass it back to the client to be displayed
                console.log("serverState is now going to voting procedure");
                sql.query("SELECT * from submissions", function (err, results) {
                    io.emit('end-submissions', {
                        submissions: results
                    });
                });
            }
            io.emit("state-change", {
                state: serverState
            });
        }, interval);
    } else {
        //interval has already been started
        console.log("game already started");
    }

    //called when a user attempts to register
    socket.on('register-attempt', function (data) {
        console.log("register attempt, " + data["username"] + ", " + data["password"]);
        var username = data["username"];
        var password = data["password"];
        //checks to see if the username already exists
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

    //called when a user attempts to login
    socket.on('login-attempt', function (data) {
        console.log("login attempt, " + data["username"] + ", " + data["password"]);
        var username = data["username"];
        var password = data["password"];
        //checks to see if the account exists
        sql.query('SELECT username, password FROM users WHERE username = ?', username, function (err, result, fields) {
            if (result.length > 0) {
                socket.emit('server-message', {
                    message: "successfully logged in"
                });
                socket.emit('login-successful', {
                    username: username
                });
            } else {
                console.log("error: login failed, user doesn't exist");
                socket.emit('server-message', {
                    message: "user doesn't exist"
                });
            }
        });
    });

    //called when a user submits a submission for the book
    socket.on('submit-text', function (data) {
        console.log("submission attempt, " + data["username"] + ", " + data["submission"]);
        var userid = "";
        var username = data["username"];
        var submission = data["submission"];
        const votes = 0;
        sql.query('SELECT uid FROM users WHERE username = ?', username, function (err, results, fields) {
            if (err) throw err;
            userid = Number(results[0].uid);
            console.log("user id of submittor is " + userid + ". results is " + results);
            sql.query("INSERT INTO submissions (uid, votes, text) VALUES (" + userid + ", 0, '" + submission + "')", function (err) {
                //console.log(this.sql);
                if (err) throw err;
                console.log("submission successful!");
            });
        });
    });

    //called when a user votes on ANY submission
    socket.on('voted', function (data) {
        console.log('a user voted for this submission: ' + data.text);
        sql.query("UPDATE submissions SET votes = votes + 1 where text = ?", data.text, function (err) {
            if (err) throw err;
            console.log("vote successfully recorded");
        });
    });

    socket.on('get-bio', function (data) {
        console.log('bio requested by ' + data.username);
        var getBio = '';
        sql.query("SELECT bio FROM users where USERNAME = ?", data.username, function (err, result) {
            if (err) throw err;
            getBio = result[0].bio;
        });
        socket.emit('give-bio', {
            bio: getBio
        });
    });

    //DEBUG function, checked to see if React component could interact with socketio server
    socket.on("react", function (data) {
        console.log("react working!");
    });

});