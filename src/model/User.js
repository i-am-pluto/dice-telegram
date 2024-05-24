const { default: mongoose, Mongoose } = require("mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: String,
    username: String,
    balance: {
        type: Number,
        default: 0
    },
    challengeIssued: {
        type: Boolean,
        default: false
    },
    currentGameId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    currentGameAmount: {
        type: Number,
        default: 0
    },
    challengeMessageId: {
        type: Number,
        default: null
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
