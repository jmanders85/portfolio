const fs = require('fs');
const mongoose = require('mongoose');

const Ranking = require('../model/Ranking');

const mongoUri = 'mongodb://localhost:27017/bacchic-tendencies';

mongoose.connect(mongoUri);
mongoose.Promise = global.Promise;

fs.readFile('coefficients.csv', 'utf8', (err, data) => {
    if (err) throw err;
    let coefficients = data.split('\n');
    coefficients = coefficients.slice(0,coefficients.length - 1);
    coefficients = coefficients.map(game => game.split('",'));
    coefficients = coefficients.map(pair => [pair[0].slice(5), parseFloat(pair[1])]);
    coefficients.sort((a, b) => b[1] - a[1]);
    coefficients = coefficients.map(pair => pair[0]);

    Ranking.findOneAndUpdate({ ludocrat: 'BTM' }, { ranking: coefficients }).then(doc => {
        console.log(doc);
        mongoose.disconnect();
    });
});
