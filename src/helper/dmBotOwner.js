require('dotenv').config()

module.exports = async (ctx, message) => {
    await ctx.telegram.sendMessage(process.env.OWNER, message)
}