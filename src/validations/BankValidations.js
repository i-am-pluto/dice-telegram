const ValidationError = require("./ValidationError");
const UserService = require("../service/UserService");

const validateAmountIsPositiveInteger = (amount) => {
    if (isNaN(amount) || amount <= 0 || !Number.isInteger(amount))
        throw new ValidationError("The amount must be a valid integer.", "INVALID_AMOUNT");
};

const validateMinimumBetAmount = (ctx, amount) => {
    if (amount < 2) {
        throw new ValidationError(`Hey [${ctx.from.first_name}](tg://user?id=${ctx.from.id}), Minimum betting amount is 2.`, "MINIMUM_BET_AMOUNT");
    }
}

const validateWithdrawalAmount = async (userId, amount) => {
    const user = await UserService.getUserById(userId);
    if (user.balance < amount) {
        throw new ValidationError("Insufficient balance for the requested withdrawal.", "INSUFFICIENT_BALANCE");
    }
};

module.exports = {
    validateAmountIsPositiveInteger,
    validateWithdrawalAmount,
    validateMinimumBetAmount
};