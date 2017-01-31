# Nerdery Application Portfolio

## Blog

My board gaming blog Bacchic Tendencies (named after my brief stint as a wine snob for Lunds & Byerys) was created as a side project to get back to my "roots," as it were, of jQuery.  I wanted to prove to myself I could create a website without a clunky build process or dependency overhead, and that I remembered how to use MongoDB.

The `/btm` directory contains some files I run with node to prepare a [Bradley-Terry Model](https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model) which combines my friends' preference rankings (as stored in the Mongo database) and returns a canonical reference ordering.  This model is run in R.  I also have a file that spreads that ordering across a [Poisson Distribution](https://en.wikipedia.org/wiki/Poisson_distribution) of ratings for entry into my user account on [Boardgame Geek](https://www.boardgamegeek.com)

The `/model` directory contains all of my Mongo schema.  NB. `Ludocrat` is a self-created nonce word I use to describe my gaming friends.  Mostly to myself.

The `/public` directory contains my views and concomitant jQuery files.

`index.js` has my mongo connection and express server.  I've changed the MongoURI to point to localhost but you can view the blog online at [bacchictendencies.com](http://www.bacchictendencies.com) should you wish.  Although it is a blog, each person has the ability to rank games they've played which I use to populate the aforementioned Bradley-Terry model.  I also mostly use the [collection](http://www.bacchictendencies.com/collection) to help determine what I'm going to play any given evening.

## Blokus - Elm project

Six months ago I heard of the language `Elm` and how learning it would make me a better React developer.  Not willing to pass up that opportunity, I created a UI for tracking wins and losses of [Blokus](https://boardgamegeek.com/boardgame/2453/blokus) and each player's [Glicko-2](https://en.wikipedia.org/wiki/Glicko_rating_system) rating.

I agree that Elm made me a better React programmer and made me more passionate about the functional programming paradigm in general.  It has inspired me to learn Haskell in my free time.  My lead on our Infor team, Adam Ranfelt, frequently comments that he can tell I've been reading Haskell books by looking at my code.
