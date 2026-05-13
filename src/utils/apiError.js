class apiError extends Error {
    constructor(
        message="An error occurred",
        statusCode,
        errors = [],
        stack = ""
    ){
        super(message);
        this.statusCode = statusCode || 500;
        this.errors = errors;
        this.stack = stack;
        this.data = null;
        this.success = false;

        if(stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { apiError };