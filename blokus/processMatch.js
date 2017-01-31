var express = require('express');
var mongoose = require('mongoose');
var async = require('async');

var glicko2 = require('glicko2');

var Match = require('./models/Match');
var Player = require('./models/Player');

var router = express.Router();

var settings = {
    // tau : "Reasonable choices are between 0.3 and 1.2, though the system should
    //      be tested to decide which value results in greatest predictive accuracy."
    tau : 0.5
};
var ranking = new glicko2.Glicko2(settings);

router.post('/', (req, res) => {
    var blue = {};
    var green = {};
    var red = {};
    var yellow = {};

    async.parallel([
        (cb) => { Player.find({ player_name: req.query.blue }, (err, result) => {
            blue.player = ranking.makePlayer(result[0].rating, result[0].rd, result[0].vol);
            blue.score = req.query.blueScore;
            cb()
        })},
        (cb) => { Player.find({ player_name: req.query.green }, (err, result) => {
            green.player = ranking.makePlayer(result[0].rating, result[0].rd, result[0].vol);
            green.score = req.query.greenScore;
            cb();
        })},
        (cb) => { Player.find({ player_name: req.query.red }, (err, result) => {
            red.player = ranking.makePlayer(result[0].rating, result[0].rd, result[0].vol);
            red.score = req.query.redScore;
            cb();
        })},
        (cb) => { Player.find({ player_name: req.query.yellow }, (err, result) => {
            yellow.player = ranking.makePlayer(result[0].rating, result[0].rd, result[0].vol);
            yellow.score = req.query.yellowScore;
            cb();
        })},
    ], () => {

        var matchArray = [blue, red, yellow, green];
        matchArray.sort((a,b) => (a.score - b.score));

        var race = ranking.makeRace([
            [matchArray[0].player],
            [matchArray[1].player],
            [matchArray[2].player],
            [matchArray[3].player]
        ]);

        ranking.updateRatings(race);

        async.parallel([
            (cb) => {
                Player.update({ player_name: req.query.blue }, { rating: blue.player.getRating(), rd: blue.player.getRd(), vol: blue.player.getVol() }).exec();
                cb();
            },
            (cb) => {
                Player.update({ player_name: req.query.green }, { rating: green.player.getRating(), rd: green.player.getRd(), vol: green.player.getVol() }).exec();
                cb();
            },
            (cb) => {
                Player.update({ player_name: req.query.red }, { rating: red.player.getRating(), rd: red.player.getRd(), vol: red.player.getVol() }).exec();
                cb();
            },
            (cb) => {
                Player.update({ player_name: req.query.yellow }, { rating: yellow.player.getRating(), rd: yellow.player.getRd(), vol: yellow.player.getVol() }).exec();
                cb();
            },
        ], () => {
            Match.create({
                blue: { player: req.query.blue, score: req.query.blueScore },
                red: { player: req.query.red, score: req.query.redScore },
                yellow: { player: req.query.yellow, score: req.query.yellowScore },
                green: { player: req.query.green, score: req.query.greenScore }
            }, (err, result) => {
                if (err) throw err;
                res.json("Saved!");
            });
        })
    });
});

module.exports = router;
