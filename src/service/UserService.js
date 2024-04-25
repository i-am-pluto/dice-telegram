const User = require("../model/User");

const getUserById = async (userId) => {
    return await User.findOne({ userId });
};

const registerOrLoginUser = async (userId, firstName, username, session) => {
    const existingUser = await User.findOne({ userId, firstName, username });
    if (existingUser) {
        return existingUser;
    }
    const newUser = new User({ userId, firstName, username, balance: 0 });
    return await newUser.save({ session });
};

const updateUserBalance = async (userId, amount, session) => {
    const user = await User.findOne({ userId });
    if (!user) {
        throw new Error('User not found');
    }
    user.balance += amount;
    return await user.save({ session });
};

const getUserBalance = async (userId) => {
    const user = await User.findOne({ userId });
    if (!user) {
        throw new Error('User not found');
    }
    return user.balance;
};

const deposit = async (userId, amount, session) => {
    return await updateUserBalance(userId, amount, session);
};

const withdraw = async (userId, amount, session) => {
    return await updateUserBalance(userId, -amount, session);
};

module.exports = {
    registerOrLoginUser,
    updateUserBalance,
    getUserBalance,
    deposit,
    withdraw,
    getUserById
};
