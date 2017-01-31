import Html exposing (..)
import Html.App as App
import Html.Attributes exposing (..)
import Html.Events exposing (onInput, onSubmit, onClick, on, targetValue)
import Http
import Task exposing (..)
import Json.Decode as Json exposing ((:=))


main : Program Never
main =
    App.program
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }

type alias Result =
    { player : String
    , score : String
    }

type alias Model =
    { players: List Player
    , newPlayer: String
    , showMatchUI: Bool
    , blue : Result
    , green : Result
    , red : Result
    , yellow : Result
    }


init : (Model, Cmd Msg)
init =
    (Model [] "" False (Result "" "") (Result "" "") (Result "" "") (Result "" ""), fetchPlayers)

type Msg
    = ShowMatchUI
    | FetchPlayers
    | FetchPlayersFail Http.Error
    | FetchPlayersSucceed (List Player)
    | NewPlayer String
    | AddNewPlayer
    | PostPlayerFail Http.Error
    | PostPlayerSucceed String
    | AddMatch
    | PostMatchFail Http.Error
    | PostMatchSucceed String
    | UpdateBluePlayer String
    | UpdateGreenPlayer String
    | UpdateRedPlayer String
    | UpdateYellowPlayer String
    | UpdateBlueScore String
    | UpdateGreenScore String
    | UpdateRedScore String
    | UpdateYellowScore String


postPlayer : String -> Cmd Msg
postPlayer newPlayer =
    Http.post decodeResponse (Http.url "/player" [ ("name", newPlayer) ]) Http.empty
        |> Task.perform PostPlayerFail PostPlayerSucceed

postMatch : Model -> Cmd Msg
postMatch model =
    Http.post decodeResponse (Http.url "/match"
        [ ("blue", model.blue.player), ("blueScore", model.blue.score)
        , ("green", model.green.player), ("greenScore", model.green.score)
        , ("yellow", model.yellow.player), ("yellowScore", model.yellow.score)
        , ("red", model.red.player), ("redScore", model.red.score)
        ]) Http.empty
        |> Task.perform PostMatchFail PostMatchSucceed


fetchPlayers : Cmd Msg
fetchPlayers =
    Task.perform FetchPlayersFail FetchPlayersSucceed (Http.get decodePlayers "/player")

decodePlayers : Json.Decoder (List Player)
decodePlayers =
    Json.list player


type alias Player = { rating : Float, player_name : String }

player : Json.Decoder Player
player =
    Json.object2 Player
        ("rating" := Json.float)
        ("player_name" := Json.string)

decodeResponse : Json.Decoder String
decodeResponse =
    Json.string


update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        ShowMatchUI ->
            ({ model | showMatchUI = True }, Cmd.none)

        FetchPlayers ->
            (model, fetchPlayers)

        FetchPlayersFail _ ->
            (model, Cmd.none)

        FetchPlayersSucceed players ->
            ({ model | players = players }, Cmd.none)

        NewPlayer player ->
            ({ model | newPlayer = player }, Cmd.none)

        AddNewPlayer ->
            (model, postPlayer model.newPlayer)

        PostPlayerFail _ ->
            ({ model | newPlayer = "ERROR?" }, Cmd.none)

        PostPlayerSucceed saved ->
            ({ model | newPlayer = "" }, fetchPlayers)

        AddMatch ->
            (model, postMatch model)

        PostMatchSucceed saved ->
            ({ model | showMatchUI = False }, fetchPlayers)

        PostMatchFail _ ->
            (model, Cmd.none)

        UpdateBluePlayer player ->
            ({ model | blue = Result player model.blue.score }, Cmd.none)

        UpdateGreenPlayer player ->
            ({ model | green = Result player model.green.score }, Cmd.none)

        UpdateRedPlayer player ->
            ({ model | red = Result player model.red.score }, Cmd.none)

        UpdateYellowPlayer player ->
            ({ model | yellow = Result player model.yellow.score }, Cmd.none)

        UpdateBlueScore score ->
            ({ model | blue = Result model.blue.player score }, Cmd.none)

        UpdateGreenScore score ->
            ({ model | green = Result model.green.player score }, Cmd.none)

        UpdateRedScore score ->
            ({ model | red = Result model.red.player score }, Cmd.none)

        UpdateYellowScore score ->
            ({ model | yellow = Result model.yellow.player score }, Cmd.none)


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none

view : Model -> Html Msg
view model =
    div []
        [ header [ style headerStyles ]
            [ h1 [ class "main-header" ] [ text "Blokus Leaderboard" ]
            , button [ class "button alert", onClick ShowMatchUI ] [ text "New Match?" ]
            ]
        , div [ class "row", style (matchUIStyles model.showMatchUI) ] [ (viewMatchUI model.players) ]
        , div [] (List.map viewPlayer (List.sortWith flippedComparison model.players))
        , div [] (List.map viewUnrated (List.filter (\player -> player.rating == 1500) model.players))
        , div [ class "row" ]
            [ Html.form [ style formStyles, class formClasses, onSubmit AddNewPlayer ]
                [ label [ for "new_player" ] [ text "Add new player" ]
                , input [ type' "text", id "new_player", placeholder "New Player", value model.newPlayer, onInput NewPlayer ] []
                , input [ type' "submit", class "button submit", value "Add Player" ] []
                ]
            ]
        ]

viewMatchUI : List Player -> Html Msg
viewMatchUI players =
    div []
    [ Html.form [ onSubmit AddMatch, class formClasses, style [("border", "1px dotted #333"), ("margin-bottom", "25px"), ("padding", "25px")] ]
        [ div [ class "row" ] [ span [ class "small-offset-9 small-3 columns" ] [ text "Score" ] ]
        , matchUIRow "Blue: " players UpdateBluePlayer UpdateBlueScore
        , matchUIRow "Green: " players UpdateGreenPlayer UpdateGreenScore
        , matchUIRow "Red: " players UpdateRedPlayer UpdateRedScore
        , matchUIRow "Yellow: " players UpdateYellowPlayer UpdateYellowScore
        , input [ type' "submit", class "button submit", value "Add Match" ] []
        ]
    ]

matchUIRow : String -> List Player -> (String -> Msg) -> (String -> Msg) -> Html Msg
matchUIRow colorText players updateplayer updatescore =
    div [ class "row" ] [ span [ class "small-2 columns" ] [ text colorText ], (playerDropDown players updateplayer), div [ class "small-3 columns" ] [ input [ type' "number", onInput updatescore ] [] ] ]

playerDropDown : List Player -> (String -> Msg) -> Html Msg
playerDropDown players update =
    select [ on "change" (Json.map update targetValue), class "small-7 columns" ] (option [] [] :: (List.map (\player -> option [ value player.player_name ] [ text player.player_name ]) players))

flippedComparison : Player -> Player -> Order
flippedComparison a b =
    case compare a.rating b.rating of
        LT -> GT
        EQ -> EQ
        GT -> LT

viewPlayer : Player -> Html Msg
viewPlayer player =
    div [ class "row" ]
        [ div [ class "medium-6 medium-centered columns" ]
            [ div [ class ((viewPlayerClass player.rating) ++ " callout clearfix") ]
                [ span [ class "float-left" ] [ text player.player_name ]
                , span [ class "float-right" ] [ text (toString (round player.rating)) ]
                ]
            ]
        ]

viewUnrated : Player -> Html Msg
viewUnrated player =
    div [ class "row" ]
        [ div [ class "medium-6 medium-centered columns" ]
            [ div [ class "secondary small callout clearfix" ]
                [ span [ class "float-left" ] [ text player.player_name ]
                , span [ class "float-right" ] [ text "Provisional" ]
                ]
            ]
        ]

viewPlayerClass: number -> String
viewPlayerClass rating =
    if rating == 1500 then
        "hide"

    else if rating < 1200 then
        "primary small"

    else if rating < 1500 then
        "success"

    else if rating < 1800 then
        "warning"

    else
        "alert large"


formClasses : String
formClasses =
    "medium-8 medium-centered columns"

matchUIStyles : Bool -> List (String, String)
matchUIStyles show =
    if show
        then [ ("display", "block") ]
        else [ ("display", "none") ]

formStyles : List (String, String)
formStyles =
    [ ("margin-top", "50px")
    , ("padding", "25px")
    , ("border", "1px dotted #333") ]

headerStyles : List (String, String)
headerStyles =
    [ ("text-align", "center")
    , ("padding", "12px")
    , ("margin-bottom", "25px")
    , ("border-bottom", "1px solid #333")
    ]
