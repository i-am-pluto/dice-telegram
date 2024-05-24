require('dotenv').config()
const { Telegraf, Markup } = require("telegraf");
const { message } = require('telegraf/filters');
const handlers = require('./src/handlers');
const connectDB = require('./config/db');
const UserService = require('./src/service/UserService');
const { default: mongoose } = require('mongoose');
const { validatePrivateChat } = require('./src/validations/ChatValidations');
const ValidationError = require('./src/validations/ValidationError');
const User = require('./src/model/User');
const dmBotOwner = require('./src/helper/dmBotOwner');


const { NAME, TOKEN } = process.env

const bot = new Telegraf(TOKEN, { username: NAME })

connectDB()


bot.use(async (ctx, next) => {
    const session = await mongoose.startSession();
    ctx.session = session;
    ctx.session.startTransaction();

    try {
        await UserService.registerOrLoginUser(ctx.from.id, ctx.from.first_name, ctx.from.username, session);
        await ctx.session.commitTransaction();
        ctx.session.endSession();
    } catch (error) {
        ctx.replyWithMarkdown("SERVER ERROR: Bot owner has been notified.");
        console.error(error); // Log the detailed error for server/admin
        await ctx.session.abortTransaction();
        ctx.session.endSession();
    }

    await next();
});

bot.start((ctx) => {
    validatePrivateChat(ctx);
    ctx.reply("Welcome to the Dice Game Bot! Type /help to see all commands.")
});

bot.help((ctx) => {
    const helpMessage = `
*List of Available Commands:*
🎲 /start.
🎲 /play [amount] - Start a new game with a bet. Use like: \`/play 100\`.
🎲 /bal - Check your current balance.
🎲 /deposit [amount] - Deposit coins into your account. Use like: \`/deposit 500\`.
🎲 /withdraw [amount] - Withdraw coins from your account. Use like: \`/withdraw 250\`.
🎲 /help - Show this help message.

*How to Use the Bot:*
1. Start by depositing some coins with \`/deposit\`.
2. Use \`/play\` to start a game in a group.
3. Use \`/withdraw\` to collect your winnings.
4. Check your balance anytime with \`/bal\`.
`;
    ctx.replyWithMarkdown(helpMessage);
});

bot.command(...handlers.gameHandler);

bot.command(...handlers.cancelHandler);

bot.command(...handlers.depositHandler);

bot.command(...handlers.withdrawHandler);

bot.command(...handlers.balanceHandler);

bot.action(...handlers.acceptGameHandler);

bot.on(...handlers.moveHandler);

bot.catch((error, ctx) => {
    ctx.replyWithMarkdown("SERVER ERROR: Bot owner has been notified.");
    dmBotOwner(ctx, error);
    console.error(error); // Log the detailed error for server/admin
});
bot.launch()
console.log("Bot is running...")

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
