const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ludocratSchema = new Schema({
    name: String,
    password: String
});

const Ludocrat = mongoose.model('Ludocrat', ludocratSchema);

module.exports = Ludocrat;
