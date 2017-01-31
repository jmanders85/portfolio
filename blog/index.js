const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('https');
const fs = require('fs');
const parseString = require('xml2js').parseString;
const parallel = require('async/parallel');
const waterfall = require('async/waterfall');
const _difference = require('lodash/difference');
const _intersection = require('lodash/intersection');
const _flatten = require('lodash/flatten');

const Entry = require('./model/Entry');
const Ludocrat = require('./model/Ludocrat');
const Ranking = require('./model/Ranking');

const app = express();
const mongoUri = 'mongodb://localhost:27017/bacchic-tendencies';

mongoose.connect(mongoUri);
mongoose.Promise = global.Promise;

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/entries', (req, res) => {
    Entry.find({}).sort('date').then(docs => {
        res.send(docs);
    });
});

app.get('/ludocrats', (req, res) => {
    Entry.distinct('plays.ludocrats').then(docs => {
        res.send(docs);
    });
});

app.get('/games/:ludocrat', (req, res) => {
    const { ludocrat } = req.params;
    const ludocratList = ludocrat.split(',');

    if (ludocrat === 'Anyone') {
        Entry.aggregate([
            { $unwind: '$plays' },
            { $group: { _id: '$plays.game', ludocrats: { $push: '$plays.ludocrats' } } }
        ]).then(docs => {
            docs = docs.map(doc => `${doc._id} -- ${processLudocrats(doc)}`);
            res.send(docs);
        });
    } else if (ludocrat === 'unplayed') {
        let bggGames = [];
        let playedGames = [];

        parallel(
            [
                (cb) => {
                    http.get('https://boardgamegeek.com/xmlapi2/collection?username=jmla&own=1', (bggres) => {
                        let body = '';
                        bggres.on('data', (d) => body += d);
                        bggres.on('end', () => {
                            parseString(body, (err, result) => {
                                if (result.message) {
                                    bggGames[0] = result.message;
                                } else {
                                    bggGames = result.items.item.map(item => item.name[0]._);
                                }
                            });
                            cb();
                        });
                    });
                },

                (cb) => {
                    Entry.aggregate([
                        { $unwind: '$plays' },
                        { $match: { 'plays.ludocrats': 'Joe' } },
                        { $group: { _id: '$plays.game' } }
                    ]).then(docs => {
                        playedGames = docs.map(doc => doc._id);
                        cb();
                    });
                }
            ],
            () => {
                res.send(_difference(bggGames, playedGames));
            }
        );
    } else if (ludocratList.length > 0) {
        const getGamesFunctions = ludocratList.map(ludocrat => {
            return (
                cb => {
                    Entry.aggregate([
                        { $unwind: '$plays' },
                        { $match: { 'plays.ludocrats': ludocrat } },
                        { $group: { _id: '$plays.game' } }
                    ]).then(docs => {
                        docs = docs.map(doc => doc._id);
                        cb(null, docs);
                    });
                }
            );
        });
        parallel(
            getGamesFunctions,
            (err, results) => {
                const commonGames = _intersection(...results);
                res.send(commonGames);
            }
        );
    } else {
        Entry.aggregate([
            { $unwind: '$plays' },
            { $match: { 'plays.ludocrats': ludocrat } },
            { $group: { _id: '$plays.game' } }
        ]).then(docs => {
            docs = docs.map(doc => doc._id);
            res.send(docs);
        });
    }
});

app.get('/collection', (req, res) => {
    res.sendFile(__dirname + '/public/view/collection.html');
});

app.get('/collection/games', (req, res) => {
    waterfall(
        [
            cb => {
                http.get('https://boardgamegeek.com/xmlapi2/collection?username=jmla&own=1', (bggres) => {
                    let body = '';
                    bggres.on('data', (d) => body += d);
                    bggres.on('end', () => {
                        parseString(body, (err, result) => {
                            if (result.message) {
                                cb('delay', result.message);
                            } else {
                                cb(null, result.items.item.map(item => item.$.objectid));
                            }
                        });
                    });
                });
            },
            (objectIds, cb) => {
                http.get(`https://boardgamegeek.com/xmlapi2/thing?stats=1&id=${objectIds}`, (bggres) => {
                    let body = '';
                    bggres.on('data', (d) => body += d);
                    bggres.on('end', () => {
                        parseString(body, (err, result) => {
                            if (result.message) {
                                cb('delay', result.message);
                            } else {
                                cb(null, result.items.item);
                            }
                        });
                    });
                })
            }
        ],
        (err, result) => {
            res.send(result);
        }
    )
});

app.get('/ranking', (req, res) => {
    const { ludocrat } = req.query;
    Ranking.findOne({ ludocrat }).then(doc => {
        if (doc) {
            res.send(doc);
        } else {
            Ranking.create({ ludocrat, ranking: [] }).then(doc => {
                res.send(doc);
            });
        }
    });
});

app.post('/ranking', (req, res) => {
    const { username, password, ranking } = req.body;
    Ludocrat.findOne({ name: username }).then(doc => {
        if (doc.password !== password) {
            res.sendStatus(401);
        } else {
            Ranking.update({ ludocrat: username }, {
                ranking
            }).then(doc => {
                res.sendStatus(200);
            });
        }
    });
});

app.get('/btmodel', (req, res) => {
    Ranking.findOne({ ludocrat: 'BTM' }).then(doc => {
        res.send(doc);
    });
});

app.get('/btbt', (req, res) => {
    res.sendFile(__dirname + '/public/view/btbt.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/view/index.html');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('listening on port', port);
});

function processLudocrats({ ludocrats }) {
    const flattenedLudocrats = Array.prototype.concat.apply([], ludocrats);
    const uniqLudocrats = flattenedLudocrats.sort().filter((item, pos, ary) => !pos || item != ary[pos - 1]);
    const noJoeLudocrats = uniqLudocrats.filter((ludocrat) => ludocrat !== 'Joe');
    return noJoeLudocrats.reduce((acc, cur, idx) => acc + (idx === 0 ? cur : `, ${cur}`), '');
}
