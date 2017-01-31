var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var schema = new Schema({
    player_name: String,
    rating: { type: Number, default: 1500 },
    rd: { type: Number, default: 350 },
    vol: { type: Number, default: 0.06}
});

var Player = mongoose.model('Player', schema);

module.exports = Player;
