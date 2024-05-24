require('dotenv').config();
const { Telegraf, Markup } = require("telegraf");
const handlers = require('./src/handlers');
const connectDB = require('./config/db');
const UserService = require('./src/service/UserService');
const { default: mongoose } = require('mongoose');
const ValidationError = require('./src/validations/ValidationError');
const User = require('./src/model/User');
const dmBotOwner = require('./src/helper/dmBotOwner');

const { NAME, TOKEN } = process.env;

const bot = new Telegraf(TOKEN, { username: NAME });

connectDB();

async function executeWithRetry(fn, maxRetries = 5) {
    let attempt = 0;
    while (attempt < maxRetries) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await fn(session);
            await session.commitTransaction();
            session.endSession();
            return;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            if (error.hasErrorLabel('TransientTransactionError') && attempt < maxRetries - 1) {
                console.warn(`TransientTransactionError encountered. Retrying attempt ${attempt + 1}...`);
                attempt++;
            } else {
                throw error;
            }
        }
    }
}


bot.start(async (ctx) => {
    try {
        await executeWithRetry(async (session) => {
            await UserService.registerOrLoginUser(ctx.from.id, ctx.from.first_name, ctx.from.username, session);
        });
        ctx.reply("Welcome to the Dice Game Bot! Type /help to see all commands.");
    } catch (error) {
        ctx.replyWithMarkdown("SERVER ERROR: Bot owner has been notified.");
        console.error(error); // Log the detailed error for server/admin
        dmBotOwner(ctx, error); // Notify bot owner of the error
    }
});

bot.help((ctx) => {
    const helpMessage = `
*List of Available Commands:*
🎲 /start - To register.
🎲 /play [amount] - Start a new game with a bet. Use like: \`/play 100\`.
🎲 /bal - Check your current balance.
🎲 /deposit [amount] - Deposit coins into your account. Use like: \`/deposit 500\`.
🎲 /withdraw [amount] - Withdraw coins from your account. Use like: \`/withdraw 250\`.
🎲 /help - Show this help message.

*How to Use the Bot:*
1. Register your account by typing \`/start\`.
2. Start by depositing some coins with \`/deposit\`.
3. Use \`/play\` to start a game in a group.
4. Use \`/withdraw\` to collect your winnings.
5. Check your balance anytime with \`/bal\`.
`;
    ctx.replyWithMarkdown(helpMessage);
});

bot.command(...handlers.gameHandler);
bot.command(...handlers.depositHandler);
bot.command(...handlers.withdrawHandler);
bot.command(...handlers.balanceHandler);
bot.action(...handlers.acceptGameHandler);
bot.action(...handlers.cancelHandler);
bot.on(...handlers.moveHandler);

bot.catch((error, ctx) => {
    ctx.replyWithMarkdown("SERVER ERROR: Bot owner has been notified.");
    dmBotOwner(ctx, error);
    console.error(error); // Log the detailed error for server/admin
});

// Launch the bot and skip updates sent while the bot was down
bot.launch({ dropPendingUpdates: true });
console.log("Bot is running...");

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
