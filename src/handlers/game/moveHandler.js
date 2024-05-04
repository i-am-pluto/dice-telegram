const { GameMessages, Emoji } = require("../../constants/GameConstants");
const GameService = require("../../service/GameService");
const UserService = require("../../service/UserService");
const { validateActiveGameBeforeMove, validateTurnOfTheUserWhoMoved, validateForwardedMessage } = require("../../validations/GameValidator");
const { default: mongoose } = require('mongoose');
const ValidationError = require("../../validations/ValidationError");
const { validateGroup } = require("../../validations/ChatValidations");
const dmBotOwner = require("../../helper/dmBotOwner");

async function processTurn(ctx, updatedGame, player1, player2) {
    const scores = GameService.getGameScores(updatedGame);
    ctx.replyWithMarkdown(GameMessages.GAME_SCORES
        .replace("{player1Name}", player1.firstName).replace("{player1Id}", player1.userId).replace("{player1Score}", scores.player1TotalScore)
        .replace("{player2Name}", player2.firstName).replace("{player2Id}", player2.userId).replace("{player2Score}", scores.player2TotalScore));

    const gameResult = await GameService.checkGameFinished(updatedGame, ctx.session);
    if (gameResult) {
        const gameWinner = gameResult.winnerId == player1.userId ? player1 : player2;
        ctx.replyWithMarkdown(GameMessages.GAME_FINISHED.replace("{winnerName}", gameWinner.firstName).replace("{winnerId}", gameWinner.userId).replace("{winnings}", gameResult.winnings));
    }
}

async function handleDiceRoll(ctx, userId, diceValue) {
    const session = await mongoose.startSession();
    ctx.session = session;
    ctx.session.startTransaction();
    try {
        validateGroup(ctx);
        await validateActiveGameBeforeMove(ctx, userId);
        validateForwardedMessage(ctx);

        const game = await GameService.findUserActiveGame(userId);
        await validateTurnOfTheUserWhoMoved(ctx, userId, game);

        const updatedGame = await GameService.updateGameScore(game, diceValue, ctx.session);
        const player1 = await UserService.getUserById(game.player1UserId);
        const player2 = await UserService.getUserById(game.player2UserId);

        if ((updatedGame.player1Scores.size + updatedGame.player2Scores.size) % 2 === 0) {
            const nextPlayer = updatedGame.turn ? player1 : player2;
            ctx.replyWithMarkdown(GameMessages.NEXT_PLAYER_TURN.replace("{nextPlayerName}", nextPlayer.firstName).replace("{nextPlayerId}", nextPlayer.userId));
            await processTurn(ctx, updatedGame, player1, player2);
        } else {
            await GameService.toggleTurn(updatedGame, ctx.session);
            const nextPlayer = updatedGame.turn ? player1 : player2;
            ctx.replyWithMarkdown(GameMessages.NEXT_PLAYER_TURN.replace("{nextPlayerName}", nextPlayer.firstName).replace("{nextPlayerId}", nextPlayer.userId));
        }
        await ctx.session.commitTransaction();
    } catch (error) {
        await ctx.session.abortTransaction();
        if (error instanceof ValidationError) {
            ctx.replyWithMarkdown(error.message);
        } else {
            ctx.replyWithMarkdown("SERVER ERROR: Bot owner has been notified.");
            dmBotOwner(ctx, error);
            console.error(error);
        }
    } finally {
        ctx.session.endSession();
    }
}

module.exports = [
    'dice', async (ctx) => {
        if (ctx.message.dice.emoji === Emoji.DICE) {
            const userId = ctx.from.id;
            const diceValue = parseInt(ctx.message.dice.value, 10);
            await handleDiceRoll(ctx, userId, diceValue);
        }
    }
];
