const mongoose = require('mongoose');
const fs = require('fs');
const waterfall = require('async/waterfall');
const Ranking = require('../model/Ranking');
const Entry = require('../model/Entry');

const mongoUri = 'mongodb://localhost:27017/bacchic-tendencies';

mongoose.connect(mongoUri);
mongoose.Promise = global.Promise;

let rankedGames = [];

waterfall(
    [
        cb => {
            Entry.aggregate([
                { $unwind: '$plays' },
                { $group: { _id: '$plays.game' } }
            ]).then(docs => {
                rankedGames = docs.map(e => e._id);
                const rankingArray = rankedGames.map(game => {
                    let subArray = new Array(rankedGames.length);
                    subArray.fill(0);
                    return subArray;
                });
                cb(null, rankedGames, rankingArray);
            });
        },
        (rankedGames, rankingArray, cb) => {
            Ranking.find({}).then(docs => {
                const rankings = docs.filter(doc => doc.ludocrat !== 'BTM').map(doc => doc.ranking).filter(a => a.length > 0);
                let ranking, winner, loser, row, col;
                for (var rankingI = 0; rankingI < rankings.length; rankingI++) {
                    ranking = rankings[rankingI];
                    for (var winI = 0; winI < ranking.length - 1; winI++) {
                        winner = ranking[winI];
                        for (var loseI = winI + 1; loseI < ranking.length; loseI++) {
                            loser = ranking[loseI];
                            row = rankedGames.indexOf(winner);
                            col = rankedGames.indexOf(loser);
                            rankingArray[row][col]++;
                        }
                    }
                }
                cb(null, rankingArray);
            });
        }
    ],
    (err, result) => {
        fs.writeFile('bt.csv', result, (err) => {
            if (err) throw err;
            console.log('sweet');
        });
        fs.writeFile('games.csv', rankedGames, (err) => {
            if (err) throw err;
            console.log(rankedGames.length);
        });
        mongoose.disconnect();
    }
);
