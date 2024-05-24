// This file contains the handler for the /cancel command
const { Messages, TelegramOptions, Regex } = require("../../constants/AcceptConstants");
const GameService = require("../../service/GameService");
const User = require("../../model/User");
const dmBotOwner = require("../../helper/dmBotOwner");


module.exports=[Regex.CANCEL_CHALLENGE, async (ctx) => {
    const userId = parseInt(ctx.match[1], 10);
        const currentUser = ctx.from.id;

        if (userId !== currentUser) {
            return ctx.replyWithMarkdown(`[${ctx.from.first_name}](tg://user?id=${currentUser}) tere baap ka button h? Cancel krra mauj me bkl`);
        }

        try {
            const user = await User.findOne({ userId });

            if (!user.challengeIssued) {
                return ctx.replyWithMarkdown("You don't have any active challenges to cancel.");
            }

            // Cancel the game challenge and restore the balance
            await GameService.cancelGameChallenge(user.currentGameId, userId, user.currentGameAmount);

            // Delete the challenge message
            if (user.challengeMessageId) {
                await ctx.telegram.deleteMessage(ctx.chat.id, user.challengeMessageId);
            }

            // Update user document to clear challenge details
            await User.updateOne({ userId }, {
                challengeIssued: false,
                currentGameId: null,
                currentGameAmount: 0,
                challengeMessageId: null // Clear the challenge message ID
            });

            ctx.replyWithMarkdown("Your challenge has been successfully cancelled.");
        } catch (error) {
            ctx.replyWithMarkdown("SERVER ERROR: Bot owner has been notified.");
            dmBotOwner(ctx, error);
            console.error(error); // Log the detailed error for server/admin
        }
}]
