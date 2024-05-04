const ValidationError = require('./ValidationError');
const GameService = require('../service/GameService');
const UserService = require('../service/UserService');

const validateTurnOfTheUserWhoMoved = async (ctx, userId, game) => {
    if (!(game.turn && game.player1UserId == userId) && !(!game.turn && game.player2UserId == userId)) {
        throw new ValidationError(`[${ctx.from.first_name}](tg://user?id=${ctx.from.id}), It's not your turn to make the move.`, "INVALID_TURN");
    }
}

const validateActiveGameBeforeMove = async (ctx, userId) => {
    const activeGame = await GameService.findUserActiveGame(userId);
    if (activeGame == null) {
        throw new ValidationError(`[${ctx.from.first_name}](tg://user?id=${ctx.from.id}), you do not have an active game. Please create a new game using /play.`, "NO_ACTIVE_GAME");
    }
}

const validateCantAcceptOwnChallenge = (ctx, targetUserId, fromUserId) => {
    if (targetUserId === fromUserId) {
        throw new ValidationError(`[${ctx.from.first_name}](tg://user?id=${ctx.from.id}), you cannot accept your own challenge.`, "CANT_ACCEPT_OWN_CHALLENGE");
    }
}

const validateNoActiveGame = async (userId, ctx) => {
    const activeGame = await GameService.findUserActiveGame(userId);
    if (activeGame) {
        if (await GameService.timeOutActiveGame(activeGame._id, ctx.session) == null)
            throw new ValidationError(`[${ctx.from.first_name}](tg://user?id=${ctx.from.id}), you already have an active game. Please complete it before starting a new one.`, "ACTIVE_GAME_EXISTS");
    }
}

const validateNoPendingGame = async (userId, ctx) => {
    const pendingGame = await GameService.findUserPendingGames(userId);
    if (pendingGame) {
        if (await GameService.timeOutPendingGame(pendingGame._id, ctx.session) == null)
            throw new ValidationError(`[${ctx.from.first_name}](tg://user?id=${ctx.from.id}), you already have a pending game. Please wait for an opponent to accept it.`, "PENDING_GAME_EXISTS");
    }
}

const validateUserBetAmountWithBalance = async (ctx, userId, amount) => {
    const user = await UserService.getUserById(userId);
    if (user.balance < amount) {
        throw new ValidationError(`[${ctx.from.first_name}](tg://user?id=${ctx.from.id}), you do not have enough balance to place a bet of ${amount} coins.`, "INSUFFICIENT_BALANCE");
    }
}

const validateChalengeeBalance = async (ctx, userId, requiredAmount) => {
    const user = await UserService.getUserById(userId);
    if (user.balance < requiredAmount) {
        throw new ValidationError(`[${ctx.from.first_name}](tg://user?id=${ctx.from.id}), you do not have enough balance to join this challenge! Required: ${requiredAmount} coins.`, "INSUFFICIENT_BALANCE");
    }
}

function validateForwardedMessage(ctx) {
    if (ctx.message && (ctx.message.forward_from || ctx.message.forward_date))
        throw new ValidationError(`Sorry [${ctx.from.first_name}](tg://user?id=${ctx.from.id}), I cannot process forwarded messages. Please don't forward dice.`, "FORWARDED_MESSAGE");
}

module.exports = {
    validateTurnOfTheUserWhoMoved,
    validateActiveGameBeforeMove,
    validateCantAcceptOwnChallenge,
    validateNoActiveGame,
    validateNoPendingGame,
    validateUserBetAmountWithBalance,
    validateChalengeeBalance,
    validateForwardedMessage
}