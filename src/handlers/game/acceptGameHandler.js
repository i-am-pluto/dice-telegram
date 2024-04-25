const Game = require("../../model/Game");
const GameService = require("../../service/GameService");
const UserService = require("../../service/UserService");
const { Markup } = require("telegraf");
const ValidationError = require('../../validations/ValidationError'); // Assuming ValidationError is available globally
const { validateGroup } = require("../../validations/ChatValidations");
const { validateNoActiveGame, validateNoPendingGame, validateChalengeeBalance, validateCantAcceptOwnChallenge } = require("../../validations/GameValidator");
const { Messages, TelegramOptions, Regex } = require("../../constants/AcceptConstants");


module.exports = [
    Regex.ACCEPT_CHALLENGE, async (ctx) => {
            ctx.session.startTransaction();

            const player1UserID = parseInt(ctx.match[1]);
            const player2UserID = ctx.from.id;
            const game = await GameService.findUserPendingGames(player1UserID);

            validateGroup(ctx);
            validateCantAcceptOwnChallenge(ctx, player1UserID, player2UserID);
            await validateNoActiveGame(player2UserID, ctx);
            await validateNoPendingGame(player2UserID, ctx);
            await validateChalengeeBalance(ctx, player2UserID, game.moneyPool);

            const acceptedGame = await GameService.acceptGameChallenge(player1UserID, player2UserID, game.moneyPool, ctx.session);
            console.log(acceptedGame)
            const user1 = await UserService.getUserById(player1UserID);

            ctx.telegram.sendMessage(player1UserID, Messages.GAME_CHALLENGE_ACCEPTED.replace("{username}", ctx.from.username), TelegramOptions.PARSE_MODE);

            ctx.editMessageText(Messages.CHALLENGE_ACCEPTED_BROADCAST.replace("{challengerName}", ctx.from.first_name).replace("{challengerId}", player2UserID).replace("{challengerName2}", user1.firstName).replace("{challengerId2}", player1UserID), TelegramOptions.PARSE_MODE);

            ctx.replyWithMarkdown(Messages.GAME_ON.replace("{playerName}", user1.firstName).replace("{playerId}", player1UserID));

            await ctx.session.commitTransaction();
            ctx.session.endSession();

    }
];