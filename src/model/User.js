const { default: mongoose, Mongoose } = require("mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema({
    userId: {
        type: String
    },
    firstName: String,
    username: String,
    balance: {
        type: Number,
        default: 0
    },
});

const User = mongoose.model("User", userSchema);
module.exports = User;