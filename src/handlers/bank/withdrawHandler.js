const { Withdraw } = require("../../constants/WithdrawConstants");
const UserService = require("../../service/UserService");
const { validatePrivateChat } = require("../../validations/ChatValidations");

module.exports = ["withdraw", async (ctx) => {
        ctx.session.startTransaction();

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
        ctx.session.endSession();
    
}];