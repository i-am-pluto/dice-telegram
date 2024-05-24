
module.exports = {
    depositHandler: require("./bank/depositHandler"),
    withdrawHandler: require("./bank/withdrawHandler"),
    acceptGameHandler: require("./game/acceptGameHandler"),
    moveHandler: require("./game/moveHandler"),
    gameHandler: require("./game/playCommandHandler"),
    balanceHandler: require("./bank/balanceHandler"),
    cancelHandler: require("./game/cancelCommandHandler"),
}