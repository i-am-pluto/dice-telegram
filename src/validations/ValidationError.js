class ValidationError extends Error {
    constructor(message, errorCode) {
        super(message);
        this.name = this.constructor.name;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ValidationError;