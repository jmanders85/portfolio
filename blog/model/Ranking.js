const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rankingSchema = new Schema({
    ludocrat: String,
    ranking: [String]
});

const Ranking = mongoose.model('Ranking', rankingSchema);

module.exports = Ranking;
