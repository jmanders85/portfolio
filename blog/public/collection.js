let collectionCache = [];
const playerRange = [2, 3, 4, 5, 6];

$(document).ready(() => {
    loadCollection();
});

function loadCollection() {
    $.ajax('/collection/games').done((data) => {
        $.ajax('/games/unplayed').done((unplayedGames) => {
            if (!Array.isArray(data)) {
                $('.collection').html(data);
            } else {
                collectionCache = data.map(game => {
                    return {
                        name: game.name[0].$.value,
                        isUnplayed: unplayedGames.indexOf(game.name[0].$.value) !== -1,
                        id: game.$.id,
                        players: playerCount(game.poll[0].results),
                        weight: parseFloat(game.statistics[0].ratings[0].averageweight[0].$.value)
                    }
                });

                init();
            }
        });
    });
}

const loadLudocrats = () => {
    $.ajax('/ludocrats').done((data) => {
        data.sort();

        const ludocratList = data.reduce((list, ludocrat) => {
            return list += `<option>${ludocrat}</option>`;
        }, '');

        $('.controls').append(`<select class="selected-ludocrats" multiple style="width:45%;margin-left:2.5%;height:150px">${ludocratList}</select><button class="update-button" style="position:relative;left:47.5%;margin-bottom:8px">Update</button>`);

        $('.update-button').on('click', () => updateUnplayed($('.selected-ludocrats').val()));
    });
};

function init() {
    let controls = playerRange.reduce((list, number) => {
        return list += `<div class="filter-container"><input type="checkbox" id="great-${number}" /><label for="great-${number}">Great with ${number}</label>
        <input type="checkbox" class="filter" id="good-${number}" /><label for="good-${number}">Good with ${number}</label></div>`
    }, '<div style="width:45%;display:inline-block;"><input type="checkbox" id="unplayed-checkbox" /><label for="unplayed-checkbox">Unplayed Only</label><input type="checkbox" class="filter" id="weight-sort" /><label for="weight-sort">Sort by weight</label>');
    controls += '</div>';
    $('.controls').append(controls);

    updateCollectionDisplay(collectionCache);
    loadLudocrats();
    // TODO: event listeners

    $('#unplayed-checkbox').change(filterDisplayAndUpdate);
    $('#weight-sort').change(filterDisplayAndUpdate);

    playerRange.forEach(number => {
        $(`#great-${number}`).change(filterDisplayAndUpdate);
        $(`#good-${number}`).change(filterDisplayAndUpdate);
    });
}

function filterDisplayAndUpdate() {
    let games = collectionCache.slice(0);

    playerRange.forEach(number => {
        if($(`#great-${number}`).is(':checked')) {
            games = games.filter(game => game.players.length >= number + 1 && game.players[number - 1].rating === 'great');
        }

        if($(`#good-${number}`).is(':checked')) {
            games = games.filter(game => game.players.length >= number + 1 && (game.players[number - 1].rating === 'great' || game.players[number - 1].rating === 'good'));
        }
    });

    if ($('#unplayed-checkbox').is(':checked')) {
        games = games.filter(game => game.isUnplayed);
    }

    if ($('#weight-sort').is(':checked')) {
        games = games.sort((a, b) => a.weight - b.weight)
    }

    updateCollectionDisplay(games);
}

function playerCount(poll) {
    return poll.map(count => {
        const rating = howsMyRating(count.result);

        return {
            rating,
            num: count.$.numplayers
        }
    });
}

function playerCountDisplay(playerCount) {
    return playerCount.reduce((list, count) => list += `<span class="count count-${count.rating}">${count.num}</span>`, '');
}

function updateCollectionDisplay(collection) {
    const display = collection.reduce((list, game) => {
        const weightClass = game.weight < 2 ? 'light' : game.weight < 3 ? 'medium' : game.weight < 4 ? 'heavy' : game.weight < 5 ? 'fat' : '';
        return list += `
            <div class="game${ game.isUnplayed ? ' game-unplayed' : '' }">
                <div><a href="http://boardgamegeek.com/boardgame/${game.id}" target="_blank">${game.name}</a><span class="${weightClass}-weight weight">Weight: ${game.weight.toFixed(2)}</span></div>
                <div>Player count: ${playerCountDisplay(game.players)}</div>
            </div>
        `;
    }, '');

    $('.collection').html(display);
}

function howsMyRating(votes) {
    const allVotes = votes.reduce((sum, vote) => sum + parseInt(vote.$.numvotes, 10), 0);

    if (votes[0].$.numvotes / allVotes > .6) {
        return 'great';
    }

    if ((parseInt(votes[0].$.numvotes, 10) + parseInt(votes[1].$.numvotes, 10)) / allVotes >= .75) {
        return 'good';
    }

    return 'bad';
}

function updateUnplayed(ludocratArray) {
    $.ajax(`/games/${ludocratArray}`).done(commonGames => {
        collectionCache.forEach(game => {
            game.isUnplayed = commonGames.indexOf(game.name) === -1
        });
        filterDisplayAndUpdate();
    });
}
