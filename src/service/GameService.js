// GameService.js
const Game = require("../model/Game");
const { updateUserBalance } = require("./UserService");

const findUserActiveGame = async (userId) => {
    return await Game.findOne({ $or: [{ player1UserId: userId }, { player2UserId: userId }], status: 'active' });
};

const findUserPendingGames = async (userId) => {
    return await Game.findOne({ 'player1UserId': userId, status: 'pending' });
};

const createGameChallenge = async (targetUserId, amount, session) => {
    const game = new Game({
        player1UserId: targetUserId,
        moneyPool: amount
    });
    await updateUserBalance(targetUserId, -amount);
    return await game.save({ session });
};

const acceptGameChallenge = async (targetUserId, userId, user_amount, session) => {
    const game = await Game.findOne({ player1UserId: targetUserId, status: 'pending' });
    game.player2UserId = userId;
    game.status = 'active';
    game.moneyPool += user_amount;
    await updateUserBalance(userId, -user_amount,session);
    return await game.save({ session });
};

const timeOutPendingGame = async (gameId, session) => {
    const game = await Game.findById(gameId);
    if (new Date(game.createdAt.getTime() + 60000) <= new Date()) {
        game.status = 'finished';
        await updateUserBalance(game.player1UserId, game.moneyPool);
        return await game.save({ session });
    }
};

const timeOutActiveGame = async (gameId, session) => {
    const game = await Game.findById(gameId);
    if (new Date(game.createdAt.getTime() + 5 * 60000) <= new Date()) {
        game.status = 'finished';
        await updateUserBalance(game.player2UserId, game.moneyPool / 2, session);
        await updateUserBalance(game.player1UserId, game.moneyPool / 2, session);
        return await game.save({ session });
    }
};

const updateGameScore = async (gameId, userId, score, session) => {
    const game = await Game.findById(gameId);

    const playerField = String(userId) == game.player1UserId ? 'player1Scores' : 'player2Scores';
    const opponentField = playerField == 'player1Scores' ? 'player2Scores' : 'player1Scores';
    game[playerField].push(score);
    if (game[playerField].length === game[opponentField].length &&
        game[playerField].slice(-1)[0] === game[opponentField].slice(-1)[0]) {
        game[playerField].pop();
        game[opponentField].pop();
    }

    game.turn = !game.turn;
    return await game.save({ session });
};

const checkGameFinished = async (gameId, session) => {
    const game = await Game.findById(gameId);
    const scores = getGameScores(game);
    if (scores.player1TotalScore === 3 || scores.player2TotalScore === 3) {
        game.status = 'finished';
        const winnerId = scores.player1TotalScore === 3 ? game.player1UserId : game.player2UserId;
        const winnings = game.moneyPool * 0.95;
        await updateUserBalance(winnerId, winnings, session);
        await game.save({ session });
        return { winnerId, winnings };
    }
};

const getGameScores = (game) => {
    if (game.player2Scores.length !== game.player1Scores.length) {
        throw new Error("Scores length not equal");
    }
    var player1TotalScore = 0;
    var player2TotalScore = 0;
    console.log(game.player1Scores, game.player2Scores)
    game.player1Scores.forEach((score, i) => {
        if (score > game.player2Scores[i]) {
            player1TotalScore++;
        } else if (score < game.player2Scores[i]) {
            player2TotalScore++;
        }
    });
    return { player1TotalScore, player2TotalScore };
};

const getGameById = async (gameId) => {
    return await Game.findById(gameId);
};

module.exports = {
    findUserActiveGame,
    findUserPendingGames,
    createGameChallenge,
    acceptGameChallenge,
    timeOutActiveGame,
    timeOutPendingGame,
    updateGameScore,
    checkGameFinished,
    getGameById,
    getGameScores,
};
