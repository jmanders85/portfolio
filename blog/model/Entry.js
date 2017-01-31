const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const entrySchema = new Schema({
    date: Date,
    plays: [{
        game: String,
        ludocrats: [String]
    }],
    comment: String
});

const Entry = mongoose.model('Entry', entrySchema);

module.exports = Entry;
