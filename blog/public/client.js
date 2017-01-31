const MONTH_ENUM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_ENUM = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

$(document).ready(() => {
    loadEntries();
    loadLudocrats();

    $('.button-gamesPlayed').on('click', loadGames);
    $('.select-ludocrat').on('change', loadGames);
});

function buildGameList(data) {
    return data.reduce((list, game) => {
        return list += `<li value="${game}">${game}</li>`;
    }, '');
}

function loadEntries() {
    $.ajax('/entries').done((data) => {
        $.each(data, (i, entry) => {
            const entryDate = new Date(entry.date);

            const gameList = entry.plays.reduce((list, play) => {
                const playerList = play.ludocrats.reduce((list, player) => {
                    return list += `<li>${player}</li>`;
                }, '');

                return list += `
                    <li>${play.game}</li>
                    <ul>
                        ${playerList}
                    </ul>
                `
            }, '');

            $('.content').prepend(
                `<div class="entry">
                    <h3>${DAY_ENUM[entryDate.getDay()]} ${MONTH_ENUM[entryDate.getMonth()]} ${entryDate.getDate()}</h3>
                    <ul>
                        ${gameList}
                    </ul>
                    ${entry.comment}
                </div>`
            );
        });
    });
}

function loadLudocrats() {
    $.ajax('/ludocrats').done((data) => {
        data.sort();

        const ludocratList = data.reduce((list, ludocrat) => {
            return list += `<option>${ludocrat}</option>`;
        }, '');

        $('.select-ludocrat').append(ludocratList);
    });
}

function loadGames() {
    $.ajax(`/games/${$('.select-ludocrat').val()}`).done((data) => {
        data.sort();
        let listTitle = 'Distinct games played: ';

        const rankingButton = $('.select-ludocrat').val() !== 'Anyone'
                              ? `<button class="unlockRanking">Rank Games</button>`
                              : '<a style="float:right;" href="/collection">View Collection</a>';

        $('.gamesPanel').html(
            `${rankingButton}
            <h3>${$('.select-ludocrat').val()}</h3>
            <div>${listTitle}${data.length}</div>
            <ul>
                ${buildGameList(data)}
            </ul>`
        );

        if ($('.gamesPanel').hasClass('gamesPanel_isEmpty')) {
            $('.gamesPanel').removeClass('gamesPanel_isEmpty');
        }

        $('.unlockRanking').on('click', () => loadRanking(data));
    });
}

function loadRanking(gamesPlayed) {
    const data = {
        'ludocrat': $('.select-ludocrat').val()
    }

    $.ajax('/ranking', {
        data,
        method: 'GET',
        contentType: 'application/json; charset=UTF-8'
    }).done(data => {
        $('.unlockRanking').toggle();
        const { ranking } = data;
        const gamesUnranked = $.grep(gamesPlayed, (x) => $.inArray(x, ranking) < 0)

        $('.gamesPanel').html(`
            <h3>${$('.select-ludocrat').val()}</h3>
            <div class="connectedGamesDiv">Ranked Games</div>
            <div class="connectedGamesDiv">Unranked Games</div>
            <div>
                <div class="connectedGamesDiv">
                    <ol id="rankedGames" class="connectedGames">${buildGameList(ranking)}</ol>
                </div>
                <div class="connectedGamesDiv">
                    <ul id="unrankedGames" class="connectedGames">${buildGameList(gamesUnranked)}</ul>
                </div>
            </div>
            <form class="submitRanking"><input type="password" id="pword" /></form>
            <input type="submit" value="Submit Ranking" class="submitRankingButton" /></form>
            <div class="validationError"></div>
        `);

        $('.submitRanking').on('submit', submitRanking);
        $('.submitRankingButton').on('click', submitRanking);

        $(() => {
            $('#rankedGames, #unrankedGames').sortable({
                dropOnEmpty: true,
                connectWith: '.connectedGames',
                update: (event, ui) => $(ui.item).addClass('updated')
            }).disableSelection();
        });
    });

    return false;
}

function submitRanking() {
    const newRanking = $('#rankedGames').sortable('toArray', { attribute: 'value' });
    const data = {
        'username': $('.select-ludocrat').val(),
        'password': $('#pword').val(),
        'ranking': newRanking
    }

    $.ajax('/ranking', {
        method: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json; charset=UTF-8',
        error: (xhr) => { if (xhr.status == 401) $('.validationError').html('WRONG') }
    }).done(data => {
        $('.updated').removeClass('updated');
        $('.validationError').html('Ranking Submitted!')
        $('#pword').val('');
        window.setTimeout(() => $('.validationError').html(''), 3000);
    });

    return false;
}
