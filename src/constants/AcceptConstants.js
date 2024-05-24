const { Markup } = require("telegraf");

module.exports = {
    Messages: {
        GAME_CHALLENGE_ACCEPTED: "🚀 *{username}* has accepted your challenge! Prepare for battle!",
        CHALLENGE_ACCEPTED_BROADCAST: "🎉 Challenge accepted! Get ready [{challengerName}](tg://user?id={challengerId}) and [{challengerName2}](tg://user?id={challengerId2})",
        GAME_ON: "🔥 Game on! It's your turn, [{playerName}](tg://user?id={playerId})!"
    },
    Regex: {
        ACCEPT_CHALLENGE: /ACCEPT_(.*)/,
        CANCEL_CHALLENGE: /CANCEL_(.*)/
    },
    TelegramOptions: {
        PARSE_MODE: { parse_mode: 'Markdown' },
        EMPTY_KEYBOARD: { reply_markup: Markup.inlineKeyboard([]) }
    }
};
