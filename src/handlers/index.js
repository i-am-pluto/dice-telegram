
module.exports = {
    depositHandler: require("./bank/depositHandler"),
    withdrawHandler: require("./bank/withdrawHandler"),
    acceptGameHandler: require("./game/acceptGameHandler"),
    moveHandler: require("./game/moveHandler"),
    gameHanlder: require("./game/playCommandHandler"),
    balanceHandler: require("./bank/balanceHandler"),
}