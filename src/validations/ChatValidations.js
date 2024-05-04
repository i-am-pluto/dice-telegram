const ValidationError = require('./ValidationError');

const validatePrivateChat = (ctx) => {
    if (ctx.chat.type !== 'private') {
        throw new ValidationError("This command can only be used in a private. Please switch to a private chat.", "NOT_PRIVATE_CHAT");
    }
}

const validateGroup = (ctx) => {
    if (!ctx.chat.type.includes('group')) {
        throw new ValidationError("This command can only be used in a group. Please switch to a group chat to play the game or add the bot to a group in which you want to play the game.", "NOT_GROUP_CHAT");
    }
};

module.exports = {
    validatePrivateChat,
    validateGroup
}
