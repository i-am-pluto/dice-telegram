const { Deposit } = require("../../constants/DepositConstants");
const { deposit } = require("../../service/UserService");
const { validatePrivateChat } = require("../../validations/ChatValidations");
const { default: mongoose } = require('mongoose');
const ValidationError = require("../../validations/ValidationError");
const dmBotOwner = require("../../helper/dmBotOwner");



module.exports = ['deposit', async (ctx) => {

    const session = await mongoose.startSession();
    ctx.session = session;
    ctx.session.startTransaction();

    try {
        validatePrivateChat(ctx);

        const args = ctx.message.text.split(' ');
        const amount = parseInt(args[1]);

        if (!amount) {
            ctx.reply(Deposit.SPECIFY_AMOUNT);
            return;
        }
        if (amount < 0) {
            ctx.reply(Deposit.INVALID_AMOUNT);
            return;
        }

        const userID = ctx.from.id;
        await deposit(userID, amount, ctx.session); // Ensure this function exists and is imported properly.

        ctx.replyWithMarkdown(Deposit.SUCCESS_DEPOSIT.replace('{amount}', amount));

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