const { Deposit } = require("../../constants/DepositConstants");
const { deposit } = require("../../service/UserService");
const { validatePrivateChat } = require("../../validations/ChatValidations");

module.exports = ['deposit', async (ctx) => {
    ctx.session.startTransaction();

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
    ctx.session.endSession();

}];