library(BradleyTerry2)

y <- read.table('bt.csv', sep=",")
z <- as.numeric(y[1,])

games <- read.table('games.csv', sep=",")
games <- as.vector(t(games)[,1])

ratings <- matrix(z,ncol=62,byrow=TRUE)
colnames(ratings) <- games
rownames(ratings) <- games
ratings <- as.table(ratings)

ratings.sf <- countsToBinomial(ratings)
names(ratings.sf)[1:2] <- c("game1", "game2")

ratingModel <- BTm(cbind(win1, win2), game1, game2, ~game, id="game", data=ratings.sf, br=TRUE)
write.csv(update(ratingModel, refcat = "Hex")$coefficients, file="coefficients.csv")
