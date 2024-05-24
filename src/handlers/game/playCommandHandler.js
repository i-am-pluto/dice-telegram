const { Markup } = require("telegraf");
const GameService = require("../../service/GameService");
const { validateNoActiveGame, validateNoPendingGame, validateUserBetAmountWithBalance } = require("../../validations/GameValidator");
const { validateGroup } = require("../../validations/ChatValidations");
const { validateAmountIsPositiveInteger, validateMinimumBetAmount } = require("../../validations/BankValidations");
const ValidationError = require("../../validations/ValidationError");
const { Errors, Commands } = require("../../constants/PlayConstants");
const { default: mongoose } = require('mongoose');
const dmBotOwner = require("../../helper/dmBotOwner");
const User = require("../../model/User");


module.exports = 
    ['play', async (ctx) => {
        const session = await mongoose.startSession();
        ctx.session = session;
        ctx.session.startTransaction();

        try {
            const userId = ctx.from.id;
            const messageText = ctx.message.text;
            const args = messageText.split(' ');
            console.log(userId);
            validateGroup(ctx);
            // await validateNoActiveGame(userId, ctx);

            const user = await User.findOne({ userId });

            if (user.challengeIssued) {
                throw new ValidationError('You already have an active challenge.');
            }

            if (args.length !== 2 || isNaN(parseInt(args[1], 10))) {
                throw new ValidationError(Commands.PLAY_USAGE, Errors.INVALID_FORMAT);
            }

            const amount = parseInt(args[1], 10);
            validateAmountIsPositiveInteger(amount);
            validateMinimumBetAmount(ctx, amount);
            await validateUserBetAmountWithBalance(ctx, userId, amount);

            // Create game challenge and store details in user document
            const createdGame = await GameService.createGameChallenge(userId, amount, session);
            
            const challengeMessage = await ctx.replyWithMarkdown(
                Commands.GAME_CHALLENGE_CREATED.replace('{firstName}', ctx.from.first_name).replace('{amount}', amount),
                Markup.inlineKeyboard([
                    Markup.button.callback('Accept Challenge', `ACCEPT_${userId}`),
                    Markup.button.callback('Cancel Challenge', `CANCEL_${userId}`)
                ]),
                { reply_to_message_id: ctx.message.message_id }
            );
    
            await User.updateOne({ userId }, {
                challengeIssued: true,
                currentGameId: createdGame._id,
                currentGameAmount: amount,
                challengeMessageId: challengeMessage.message_id // Store the challenge message ID
            }, { session });
            await ctx.session.commitTransaction();

        } catch (error) {
            if (error instanceof ValidationError) {
                ctx.replyWithMarkdown(error.message);
            } else {
                ctx.replyWithMarkdown("SERVER ERROR: Bot owner has been notified.");
                dmBotOwner(ctx, error);
                console.error(error); // Log the detailed error for server/admin
            }
            await ctx.session.abortTransaction();
        } finally {
            ctx.session.endSession();
        }
    }];