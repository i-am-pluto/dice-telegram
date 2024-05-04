const { Withdraw } = require("../../constants/WithdrawConstants");
const UserService = require("../../service/UserService");
const { validatePrivateChat } = require("../../validations/ChatValidations");
const { default: mongoose } = require('mongoose');
const ValidationError = require("../../validations/ValidationError");
const dmBotOwner = require("../../helper/dmBotOwner");


module.exports = ["withdraw", async (ctx) => {
    const session = await mongoose.startSession();
    ctx.session = session;
    ctx.session.startTransaction();

    try {

        validatePrivateChat(ctx);

        const args = ctx.message.text.split(" ");
        const amount = parseInt(args[1]);

        if (isNaN(amount) || amount <= 0) {
            ctx.reply(Withdraw.INVALID_AMOUNT);
            return;
        }

        const userID = ctx.from.id;
        const userBalance = await UserService.getUserBalance(userID);
        if (userBalance < amount) {
            ctx.reply(Withdraw.INSUFFICIENT_BALANCE);
            return;
        }

        await UserService.withdraw(userID, amount, ctx.session);
        ctx.reply(Withdraw.SUCCESS_WITHDRAWAL.replace("{amount}", amount).replace("{newBalance}", userBalance - amount));

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