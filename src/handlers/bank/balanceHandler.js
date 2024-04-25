const { Balance } = require('../../constants/BalanceConstants');
const UserService = require('./../../service/UserService');

module.exports = ['bal', async (ctx) => {
    ctx.session.startTransaction();

    const userId = ctx.from.id;
    const user = await UserService.getUserById(userId);
    const balance = await UserService.getUserBalance(userId);

    const response = Balance.BALANCE_MESSAGE.replace('{firstName}', user.firstName).replace('{balance}', balance);
    ctx.replyWithMarkdown(response, { reply_to_message_id: ctx.message.message_id });

    await ctx.session.commitTransaction();
    ctx.session.endSession();
}];