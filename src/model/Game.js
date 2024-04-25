const { default: mongoose, Mongoose } = require("mongoose");

const Schema = mongoose.Schema;
const gameSchema = new Schema({
    player1UserId: {
        type: String
    },
    player2UserId: {
        type: String
    },

    player1Scores: [{
        type: Number,
    }],
    player2Scores: [{
        type: Number,
        default: 0
    }],

    turn: {
        type: Boolean,
        default: true
    },

    status: {
        type: String,
        enum: ['pending', 'active', 'finished'],
        default: 'pending'
    },

    moneyPool: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Game = mongoose.model("Game", gameSchema);
module.exports = Game;