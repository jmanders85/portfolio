var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var matchSchema = new Schema({
    blue: {
        player: String,
        score: String
    },
    green: {
        player: String,
        score: String
    },
    red: {
        player: String,
        score: String
    },
    yellow: {
        player: String,
        score: String
    },
});

var Match = mongoose.model('Match', matchSchema);

module.exports = Match;
