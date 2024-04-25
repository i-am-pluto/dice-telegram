const { Markup } = require("telegraf");
const GameService = require("../../service/GameService");
const { validateNoActiveGame, validateNoPendingGame, validateUserBetAmountWithBalance } = require("../../validations/GameValidator");
const { validateGroup } = require("../../validations/ChatValidations");
const { validateAmountIsPositiveInteger, validateMinimumBetAmount } = require("../../validations/BankValidations");
const ValidationError = require("../../validations/ValidationError");
const { Errors, Commands } = require("../../constants/PlayConstants");

module.exports = ['play', async (ctx) => {
    ctx.session.startTransaction();

    const userId = ctx.from.id;
    const messageText = ctx.message.text;
    const args = messageText.split(' ');

    validateGroup(ctx);
    await validateNoActiveGame(userId, ctx);
    await validateNoPendingGame(userId, ctx);

    if (args.length !== 2 || isNaN(parseInt(args[1], 10))) {
        throw new ValidationError(Commands.PLAY_USAGE, Errors.INVALID_FORMAT);
    }

    const amount = parseInt(args[1], 10);
    validateAmountIsPositiveInteger(amount);
    validateMinimumBetAmount(ctx,amount);
    await validateUserBetAmountWithBalance(ctx, userId, amount);
    // Creating the game challenge
    const createdGame = await GameService.createGameChallenge(userId, amount);
    console.log(createdGame);

    ctx.replyWithMarkdown(Commands.GAME_CHALLENGE_CREATED.replace('{firstName}', ctx.from.first_name).replace('{amount}', amount),
        Markup.inlineKeyboard([
            Markup.button.callback('Accept Challenge', `ACCEPT_${userId}`)
        ]),
        { reply_to_message_id: ctx.message.message_id }
    );

    await ctx.session.commitTransaction();
    ctx.session.endSession();

}];