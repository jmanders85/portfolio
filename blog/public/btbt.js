const MU = 7;
const DOMAIN = [9, 8, 7, 6, 5, 4, 3, 2, 1];
const rawPoisson = DOMAIN.map(x => (Math.pow(MU, x) / (Math.pow(Math.E, MU) * rFact(x))));
const sumPoisson = rawPoisson.reduce((acc, x) => acc + x);
const normPoisson = rawPoisson.map(x => x / sumPoisson);

$(document).ready(() => {
    loadRanking();
});

function loadRanking() {
    $.ajax('/btmodel', {
        method: 'GET',
        contentType: 'application/json; charset=UTF-8'
    }).done(data => {
        const noOfGames = data.ranking.length;
        const gamesPerSegment = normPoisson.map(x => Math.round(x * noOfGames));
        let sumOfGamesPerSegment = gamesPerSegment.reduce((acc, x) => acc + x);
        while (noOfGames < sumOfGamesPerSegment) {
            gamesPerSegment[8]--;
            sumOfGamesPerSegment = gamesPerSegment.reduce((acc, x) => acc + x);
        }
        while (noOfGames > sumOfGamesPerSegment) {
            gamesPerSegment[2]++;
            sumOfGamesPerSegment = gamesPerSegment.reduce((acc, x) => acc + x);
        }

        let domainIndex = 0;
        let currentRating = DOMAIN[domainIndex] + 1;
        let segmentGames = gamesPerSegment[domainIndex];
        let decreaseFactor = 1 / segmentGames;

        const finalRanking = data.ranking.map(game => {
            if (segmentGames > 0) {
                rating = currentRating
                currentRating -= decreaseFactor;
                segmentGames--;
            } else {
                domainIndex++;
                currentRating = DOMAIN[domainIndex] + 1;
                segmentGames = gamesPerSegment[domainIndex];
                decreaseFactor = 1 / segmentGames;
                rating = currentRating;
                currentRating -= decreaseFactor;
                segmentGames--;
            }

            return {
                game,
                rating
            };
        });

        finalRanking.forEach(ranking => $('.content').append(`
            <div class="rating-group"><span class="game">${ranking.game}</span><span class="rating">${ranking.rating.toFixed(2)}</span></div>
        `));

        $('.rating-group').on('click', toggleEnteredClass);
    });
}

function toggleEnteredClass() {
    $(this).toggleClass('entered');
}

function rFact(num) {
    if (num === 0)
      { return 1; }
    else
      { return num * rFact( num - 1 ); }
}
