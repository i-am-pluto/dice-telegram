
const { GameMessages, Emoji } = require("../../constants/GameConstants");
const GameService = require("../../service/GameService");
const UserService = require("../../service/UserService");
const { validateGroup } = require("../../validations/ChatValidations");
const { validateActiveGameBeforeMove, validateTurnOfTheUserWhoMoved, validateForwardedMessage } = require("../../validations/GameValidator");

module.exports = [
    'dice', async (ctx) => {
        ctx.session.startTransaction();

        validateGroup(ctx);
        if (ctx.message.dice.emoji === Emoji.DICE) {

            const userId = ctx.from.id;
            const diceValue = parseInt(ctx.message.dice.value, 10);
            await validateActiveGameBeforeMove(ctx, userId);
            validateForwardedMessage(ctx);
            const game = await GameService.findUserActiveGame(userId);
            await validateTurnOfTheUserWhoMoved(ctx, userId, game);
            const updatedGame = await GameService.updateGameScore(game._id, userId, diceValue, ctx.session);
            const player1 = await UserService.getUserById(game.player1UserId);
            const player2 = await UserService.getUserById(game.player2UserId);


            if ((updatedGame.player1Scores.length + updatedGame.player2Scores.length) % 2 === 0) {
                const { player1TotalScore, player2TotalScore } = GameService.getGameScores(updatedGame);
                ctx.replyWithMarkdown(GameMessages.GAME_SCORES.replace("{player1Name}", player1.firstName).replace("{player1Id}", player1.userId).replace("{player1Score}", player1TotalScore).replace("{player2Name}", player2.firstName).replace("{player2Id}", player2.userId).replace("{player2Score}", player2TotalScore));
                const gameResult = await GameService.checkGameFinished(game._id, ctx.session);
                if (gameResult) {
                    const gameWinner = gameResult.winnerId == player1.userId ? player1 : player2;
                    ctx.replyWithMarkdown(GameMessages.GAME_FINISHED.replace("{winnerName}", gameWinner.firstName).replace("{winnerId}", gameWinner.userId).replace("{winnings}", gameResult.winnings));
                    return;
                }
            }

            const nextPlayer = game.turn ? player2 : player1;
            ctx.replyWithMarkdown(GameMessages.NEXT_PLAYER_TURN.replace("{nextPlayerName}", nextPlayer.firstName).replace("{nextPlayerId}", nextPlayer.userId));

        }

        await ctx.session.commitTransaction();
        ctx.session.endSession();

    }

];