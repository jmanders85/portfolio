var express = require('express');
var mongoose = require('mongoose');

var Player = require('./models/Player');

var processMatch = require('./processMatch');

var app = express();

require('dotenv').config();

var mongoURI = process.env.MONGOURI || "mongodb://localhost:27017/blokus";
var MongoDB = mongoose.connect(mongoURI).connection;

MongoDB.on('error', (err) => console.log(err));
MongoDB.once('open', () => console.log('mongo hooked up'));

app.use(express.static('assets'));

app.use('/match', processMatch);

// TODO associate player with color count
app.get('/player', (req, res) => {
    Player.find({}, (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

app.post('/player', (req, res) => {
    Player.create({ player_name: req.query.name }, (err, result) => {
        if (err) throw err;
        res.json("Saved!");
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/assets/index.html');
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
    var port = server.address().port;
    console.log("Listening on port", port);
});
