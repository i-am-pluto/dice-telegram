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
    await updateUserBalance(userId, -user_amount, session);
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

const updateGameScore = async (game, score, session) => {
    let currentRoundPlayer1 = game.player1Scores.size + 1;  // Assuming new rounds are added consecutively
    let currentRoundPlayer2 = game.player2Scores.size + 1;  // Assuming new rounds are added consecutively
    if (game.turn) {
        game.player1Scores.set(currentRoundPlayer1.toString(), score);
    } else {
        game.player2Scores.set(currentRoundPlayer2.toString(), score);
    }
    return await game.save({ session });
};

const toggleTurn = async (game, session) => {
    game.turn = !game.turn;
    return await game.save({ session });
}

const checkGameFinished = async (game, session) => {
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

    if (game.player1Scores.size !== game.player2Scores.size) {
        throw new Error("Scores cannot be calculated until both players have played the same number of rounds.");
    }

    let player1TotalScore = 0;
    let player2TotalScore = 0;

    game.player1Scores.forEach((score1, round) => {
        const score2 = game.player2Scores.get(round);
        if (score1 > score2) {
            player1TotalScore++;
        } else if (score1 < score2) {
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
    toggleTurn
};
