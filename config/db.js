const { default: mongoose } = require("mongoose");
require("dotenv").config();
const connectDB = async () => {
    try {
        const uri = process.env.MONGO;
        return await mongoose.connect(uri);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

module.exports = connectDB;